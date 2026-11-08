/**
 * File: Attendance.gs
 * Description: Core Attendance tracking, Geofencing validation, and History retrieval.
 */

const Attendance = {
  /**
   * Record Clock In or Clock Out
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

    const lat = Number(data.latitude) || 0;
    const lng = Number(data.longitude) || 0;
    const accuracy = Number(data.accuracy) || 50;

    // Check Geofence with all active locations
    const locations = Db.find(CONFIG.SHEETS.LOCATIONS, l => l.Status === 'Active');
    let matchedLocation = null;
    let shortestDistance = 999999;

    locations.forEach(loc => {
      const dist = Utils.calculateDistance(lat, lng, Number(loc.Latitude), Number(loc.Longitude));
      if (dist < shortestDistance) {
        shortestDistance = dist;
        matchedLocation = loc;
      }
    });

    if (!matchedLocation && locations.length > 0) {
      matchedLocation = locations[0];
    }

    const radius = matchedLocation ? Number(matchedLocation.RadiusMeter || 200) : 200;
    const isWithinGeofence = shortestDistance <= radius;

    // Determine status: ON_TIME, LATE, CHECKED_OUT, EARLY_LEAVE
    let status = CONFIG.ATTENDANCE_STATUS.ON_TIME;
    let remark = data.remark || '';

    if (actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN) {
      const lateCheck = Utils.checkLateStatus(workTime, user.WorkStart || CONFIG.DEFAULTS.WORK_START);
      if (lateCheck.isLate) {
        status = CONFIG.ATTENDANCE_STATUS.LATE;
        remark = `มาสาย ${lateCheck.lateMinutes} นาที`;
      }
    } else {
      const earlyCheck = Utils.checkEarlyLeaveStatus(workTime, user.WorkEnd || CONFIG.DEFAULTS.WORK_END);
      if (earlyCheck.isEarly) {
        status = CONFIG.ATTENDANCE_STATUS.EARLY_LEAVE;
        remark = `ออกก่อนเวลา ${earlyCheck.earlyMinutes} นาที`;
      } else {
        status = CONFIG.ATTENDANCE_STATUS.CHECKED_OUT;
      }
    }

    if (!isWithinGeofence && workMode === CONFIG.WORK_MODES.ONSITE) {
      remark += (remark ? ' | ' : '') + `อยู่นอกพื้นที่สำนักงาน (${shortestDistance} ม.)`;
    }

    // Upload Selfie if provided
    let selfieUrl = '';
    if (data.selfieBase64) {
      selfieUrl = Files.uploadSelfie(data.selfieBase64, user.EmployeeCode, actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'IN' : 'OUT');
    }

    const attendanceId = 'ATT' + Date.now();
    const resolvedAddress = data.address || (matchedLocation ? matchedLocation.Address : '567 ถนนนนทบุรี ตำบลบางกระสอ อำเภอเมือง จังหวัดนนทบุรี 11000');

    const logRecord = {
      AttendanceID: attendanceId,
      UserID: user.UserID,
      EmployeeCode: user.EmployeeCode,
      FullName: user.FullName,
      WorkDate: workDate,
      WorkTime: workTime,
      Type: actionType,
      Status: status,
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

    Db.insert(CONFIG.SHEETS.ATTENDANCE, logRecord);

    // Create Notification
    const notifTitle = actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'ลงเวลาเข้างานสำเร็จ' : 'ลงเวลาออกงานสำเร็จ';
    const notifMsg = `${actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'เข้างาน' : 'ออกงาน'} เมื่อ ${workTime} น. สถานะ: ${status}`;
    Notify.sendInApp(user.UserID, notifTitle, notifMsg, 'ATTENDANCE');

    return Utils.success({
      attendance: logRecord,
      isWithinGeofence: isWithinGeofence,
      distanceMeter: shortestDistance
    }, actionType === CONFIG.ATTENDANCE_TYPE.CHECK_IN ? 'บันทึกเวลาเข้างานเรียบร้อย' : 'บันทึกเวลาออกงานเรียบร้อย');
  },

  /**
   * Get attendance history for user, with optional date filtering
   */
  getHistory(token, startDate = '', endDate = '') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let logs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID);

    if (startDate && endDate) {
      logs = logs.filter(a => {
        const d = a.WorkDate;
        return d >= startDate && d <= endDate;
      });
    }

    // Sort descending by CreatedAt
    logs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    // Group logs by Thai Date
    const grouped = {};
    const calendarStatusMap = {};

    logs.forEach(log => {
      const thaiDate = Utils.formatThaiDate(log.WorkDate);
      if (!grouped[thaiDate]) {
        grouped[thaiDate] = {
          date: log.WorkDate,
          thaiDate: thaiDate,
          items: []
        };
      }
      grouped[thaiDate].items.push(log);

      // Map for calendar dot indicators
      if (!calendarStatusMap[log.WorkDate]) {
        calendarStatusMap[log.WorkDate] = { hasIn: false, hasOut: false };
      }
      if (log.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN) {
        calendarStatusMap[log.WorkDate].hasIn = true;
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
   * Get detail of a specific attendance record (for IMG_1195.PNG)
   */
  getDetail(token, attendanceId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    const record = Db.findOne(CONFIG.SHEETS.ATTENDANCE, a => a.AttendanceID === attendanceId);
    if (!record) {
      return Utils.error('ไม่พบข้อมูลการลงเวลานี้');
    }

    const thaiDateTime = Utils.formatThaiDateTime(record.CreatedAt);

    return Utils.success({
      record: record,
      thaiDateTime: thaiDateTime
    });
  },

  /**
   * Get Today's punch status for user
   */
  getTodayStatus(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    const todayISO = Utils.formatISODate(new Date());
    const todayLogs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID && a.WorkDate === todayISO);

    let checkIn = todayLogs.find(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN) || null;
    let checkOut = todayLogs.find(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_OUT) || null;

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
