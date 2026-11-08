/**
 * File: Attendance.gs
 * Description: Enterprise Attendance Engine with GPS Accuracy Buffer, Dual-Office, and Duplicate Window.
 */

const Attendance = {
  /**
   * Record Clock In or Clock Out with Enterprise Validation
   */
  record(token, data) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    const actionType = data.type === 'CHECK_OUT' ? CONFIG.ATTENDANCE_TYPE.CHECK_OUT : CONFIG.ATTENDANCE_TYPE.CHECK_IN;
    const now = new Date();
    const workDate = Utils.formatISODate(now);
    const workTime = Utils.formatTime(now);
    const workMode = data.workMode || CONFIG.WORK_MODES.ONSITE;

    // 1. Time Window Evaluation
    const timeCheck = Utils.evaluateTimeWindow(actionType, workTime);
    if (!timeCheck.allowed) {
      return Utils.error(timeCheck.message, 'TIME_WINDOW_VIOLATION');
    }

    // 2. Duplicate Submission Window Check (60 seconds)
    const recentEvents = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID && a.WorkDate === workDate);
    const sameActionEvents = recentEvents.filter(a => a.Type === actionType);

    if (sameActionEvents.length > 0) {
      const lastEvent = sameActionEvents[sameActionEvents.length - 1];
      const elapsedSeconds = Math.round((now.getTime() - new Date(lastEvent.CreatedAt).getTime()) / 1000);
      if (elapsedSeconds < CONFIG.TIME_WINDOWS.DUPLICATE_WINDOW_SECONDS) {
        return Utils.error(`ท่านเพิ่งบันทึกรายการไปเมื่อ ${elapsedSeconds} วินาทีก่อน กรุณารออย่างน้อย 1 นาที`, 'DUPLICATE_SUBMISSION');
      }
    }

    // 3. GPS Geofence Evaluation with Accuracy Buffer
    const lat = Number(data.latitude) || 0;
    const lng = Number(data.longitude) || 0;
    const accuracy = Number(data.accuracy) || 30;

    const locations = Db.find(CONFIG.SHEETS.LOCATIONS, l => l.Status === 'Active');
    let matchedLocation = null;
    let shortestDistance = 999999;
    let geofenceResult = { isInside: false, bufferMeters: 0 };

    locations.forEach(loc => {
      const dist = Utils.calculateDistance(lat, lng, Number(loc.Latitude), Number(loc.Longitude));
      if (dist < shortestDistance) {
        shortestDistance = dist;
        matchedLocation = loc;
      }
    });

    if (matchedLocation) {
      geofenceResult = Utils.evaluateGeofence(shortestDistance, matchedLocation.RadiusMeter, accuracy);
    } else if (locations.length > 0) {
      matchedLocation = locations[0];
      geofenceResult = Utils.evaluateGeofence(shortestDistance, 300, accuracy);
    }

    // If Onsite, enforce Geofence
    if (workMode === CONFIG.WORK_MODES.ONSITE && !geofenceResult.isInside) {
      return Utils.error(
        `อยู่นอกพื้นที่ลงเวลา (${shortestDistance} ม. จาก${matchedLocation ? matchedLocation.LocationName : 'สำนักงาน'}) รัศมีที่อนุญาต ${matchedLocation ? matchedLocation.RadiusMeter : 300} ม.`,
        'OUT_OF_GEOFENCE'
      );
    }

    // 4. Calculate WorkMinutes if Check-out
    let workMinutes = 0;
    let checkInLog = null;
    if (actionType === CONFIG.ATTENDANCE_TYPE.CHECK_OUT) {
      checkInLog = recentEvents.find(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN);
      if (checkInLog) {
        const inMinutes = Utils.timeToMinutes(checkInLog.WorkTime);
        const outMinutes = Utils.timeToMinutes(workTime);
        workMinutes = Math.max(0, outMinutes - inMinutes);
      }
    }

    // 5. Selfie image upload
    let selfieUrl = '';
    if (data.selfieBase64) {
      selfieUrl = Files.uploadSelfie(data.selfieBase64, user.EmployeeCode, actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'IN' : 'OUT');
    }

    let remark = data.remark || '';
    if (timeCheck.status === CONFIG.ATTENDANCE_STATUS.LATE) {
      remark = `มาสาย ${timeCheck.lateMinutes} นาที`;
    } else if (timeCheck.status === CONFIG.ATTENDANCE_STATUS.EARLY_LEAVE) {
      remark = `ออกก่อนเวลา ${timeCheck.earlyMinutes} นาที`;
    }

    const attendanceId = 'ATT' + Date.now();
    const resolvedAddress = data.address || (matchedLocation ? matchedLocation.Address : '567 ถนนนนทบุรี ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000');

    const record = {
      AttendanceID: attendanceId,
      UserID: user.UserID,
      EmployeeCode: user.EmployeeCode,
      FullName: user.FullName,
      WorkDate: workDate,
      WorkTime: workTime,
      Type: actionType,
      Status: timeCheck.status,
      Latitude: lat,
      Longitude: lng,
      Accuracy: accuracy,
      DistanceMeter: shortestDistance,
      LocationID: matchedLocation ? matchedLocation.LocationID : 'LOC001',
      LocationName: matchedLocation ? matchedLocation.LocationName : 'สำนักงานหลัก',
      Address: resolvedAddress,
      DeviceInfo: data.deviceInfo || 'Mobile Web',
      UserAgent: data.userAgent || '',
      SelfieUrl: selfieUrl,
      WorkMode: workMode,
      CreatedAt: now.toISOString(),
      Remark: remark
    };

    Db.insert(CONFIG.SHEETS.ATTENDANCE, record);

    // Record Event in Attendance_Events
    try {
      Db.insert(CONFIG.SHEETS.ATTENDANCE_EVENTS, {
        EventID: 'EVT' + Date.now(),
        AttendanceID: attendanceId,
        UserID: user.UserID,
        Action: actionType,
        Latitude: lat,
        Longitude: lng,
        Accuracy: accuracy,
        DistanceMeters: shortestDistance,
        Status: timeCheck.status,
        WorkMode: workMode,
        CreatedAt: now.toISOString()
      });
    } catch (e) {
      Logger.log('Attendance_Events log error: ' + e.toString());
    }

    // In-app Notification
    const notifTitle = actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'ลงเวลาเข้างานสำเร็จ' : 'ลงเวลาออกงานสำเร็จ';
    const notifMsg = `${actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'เข้างาน' : 'ออกงาน'} เมื่อ ${workTime} น. (${timeCheck.status}) ${matchedLocation ? matchedLocation.LocationName : ''}`;
    Notify.sendInApp(user.UserID, notifTitle, notifMsg, 'ATTENDANCE');

    return Utils.success({
      attendance: record,
      isWithinGeofence: geofenceResult.isInside,
      distanceMeter: shortestDistance,
      workMinutes: workMinutes
    }, actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'ลงเวลาเข้างานสำเร็จ' : 'ลงเวลาออกงานสำเร็จ');
  },

  /**
   * Get Dual-Office Information for User
   */
  getUserOffices(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    const locations = Db.find(CONFIG.SHEETS.LOCATIONS, l => l.Status === 'Active');
    const mainOffice = locations.find(l => l.LocationID === 'LOC001') || CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE;
    const siteOffice = locations.find(l => l.LocationID === 'LOC002') || CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE;

    return Utils.success({
      mainOffice: mainOffice,
      siteOffice: siteOffice,
      allLocations: locations
    });
  },

  /**
   * Get attendance history
   */
  getHistory(token, startDate = '', endDate = '') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let logs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID);
    if (startDate && endDate) {
      logs = logs.filter(a => a.WorkDate >= startDate && a.WorkDate <= endDate);
    }

    logs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    const grouped = {};
    const calendarStatusMap = {};

    logs.forEach(log => {
      const thaiDate = Utils.formatThaiDate(log.WorkDate);
      if (!grouped[thaiDate]) {
        grouped[thaiDate] = { date: log.WorkDate, thaiDate: thaiDate, items: [] };
      }
      grouped[thaiDate].items.push(log);

      if (!calendarStatusMap[log.WorkDate]) {
        calendarStatusMap[log.WorkDate] = { hasIn: false, hasOut: false, isLate: false };
      }
      if (log.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN) {
        calendarStatusMap[log.WorkDate].hasIn = true;
        if (log.Status === CONFIG.ATTENDANCE_STATUS.LATE) calendarStatusMap[log.WorkDate].isLate = true;
      }
      if (log.Type === CONFIG.ATTENDANCE_TYPE.CHECK_OUT) {
        calendarStatusMap[log.WorkDate].hasOut = true;
      }
    });

    return Utils.success({
      historyList: logs,
      groupedHistory: Object.values(grouped),
      calendarStatusMap: calendarStatusMap
    });
  },

  /**
   * Get attendance detail
   */
  getDetail(token, attendanceId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    const record = Db.findOne(CONFIG.SHEETS.ATTENDANCE, a => a.AttendanceID === attendanceId);
    if (!record) return Utils.error('ไม่พบข้อมูลการลงเวลานี้');

    return Utils.success({
      record: record,
      thaiDateTime: Utils.formatThaiDateTime(record.CreatedAt)
    });
  },

  /**
   * Today status
   */
  getTodayStatus(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    const todayISO = Utils.formatISODate(new Date());
    const todayLogs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID && a.WorkDate === todayISO);

    const checkIn = todayLogs.find(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN) || null;
    const checkOut = todayLogs.find(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_OUT) || null;

    return Utils.success({
      todayISO: todayISO,
      todayThai: Utils.formatThaiFullDate(new Date()),
      checkIn: checkIn,
      checkOut: checkOut,
      hasCheckedIn: !!checkIn,
      hasCheckedOut: !!checkOut
    });
  }
};
