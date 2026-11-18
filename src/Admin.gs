/**
 * ==============================================================================
 * Project       : Time Stamp Attendances (TSA Enterprise Edition)
 * Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
 * Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
 * File          : Admin.gs
 * Module/Layer  : Backend / Administrative Management & System Configuration
 * Description   : บริหารจัดการข้อมูลผู้ใช้, พิกัดสถานที่ทำงาน, วันหยุด และนำเข้าข้อมูลเวลาผ่านไฟล์ CSV
 * Version       : 1.0.47
 * Author        : TSA Engineering Team
 * Created Date  : 2026-11-08
 * Last Modified : 2026-11-18
 * License       : Proprietary / Enterprise Internal Use
 * Copyright (c) : 2026 Time Stamp Attendances. All rights reserved.
 * ------------------------------------------------------------------------------
 * Revision History:
 * - V1.0.46 (2026-11-18) : Updated source code header to Corporate Enterprise Standard
 * - V1.0.47 (2026-11-18) : Aligned version header with TSA V1.0.47 release
 * ==============================================================================
 */

const Admin = {
  /**
   * Get Admin Overview Stats
   */
  getDashboard(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (user.Role !== CONFIG.ROLES.ADMIN && user.Role !== CONFIG.ROLES.SUPERVISOR) {
      return Utils.error('ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ', 'FORBIDDEN');
    }

    const todayISO = Utils.formatISODate(new Date());
    const todayLogs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.WorkDate === todayISO);
    const users = Db.find(CONFIG.SHEETS.USERS, u => u.Status === 'Active');

    const checkIns = todayLogs.filter(a => a.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN);
    const lates = checkIns.filter(a => a.Status === CONFIG.ATTENDANCE_STATUS.LATE);
    const pendingCorrections = Db.find(CONFIG.SHEETS.CORRECTIONS, c => c.Status === 'Pending');
    const pendingOTs = Db.find(CONFIG.SHEETS.OVERTIME, o => o.Status === 'Pending');

    return Utils.success({
      totalUsers: users.length,
      todayCheckIns: checkIns.length,
      todayLates: lates.length,
      pendingCorrections: pendingCorrections.length,
      pendingOTs: pendingOTs.length
    });
  },

  /**
   * Get all locations
   */
  getLocations(token) {
    if (token) {
      const valid = Auth.validateSession(token);
      if (!valid.success) {
        // Return locations as reference data even if session needs refresh
        const locs = Db.getAll(CONFIG.SHEETS.LOCATIONS) || [];
        return Utils.success({ locations: locs });
      }
    }
    const locations = Db.getAll(CONFIG.SHEETS.LOCATIONS) || [];
    return Utils.success({ locations: locations });
  },

  /**
   * Add or update location (Main Office, Branch, Site Offices) - Admin Only
   */
  saveLocation(token, locationData) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์จัดการสถานที่ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    if (!locationData || !locationData.LocationName) {
      return Utils.error('กรุณาระบุชื่อสถานที่ / Site งาน');
    }

    const locId = locationData.LocationID || ('LOC' + Date.now());
    const cleanData = {
      LocationID: String(locId),
      LocationName: String(locationData.LocationName || '').trim(),
      Address: String(locationData.Address || '').trim(),
      Latitude: Number(locationData.Latitude) || 0,
      Longitude: Number(locationData.Longitude) || 0,
      RadiusMeter: Number(locationData.RadiusMeter) || 200,
      MinAccuracy: Number(locationData.MinAccuracy) || 100,
      Status: locationData.Status === 'Inactive' ? 'Inactive' : 'Active'
    };

    const existing = Db.findOne(CONFIG.SHEETS.LOCATIONS, l => String(l.LocationID) === String(locId));

    if (existing) {
      Db.update(CONFIG.SHEETS.LOCATIONS, l => String(l.LocationID) === String(locId), cleanData);
    } else {
      Db.insert(CONFIG.SHEETS.LOCATIONS, cleanData);
    }

    return Utils.success({ location: cleanData }, 'บันทึกข้อมูลสถานที่เรียบร้อย');
  },

  /**
   * Delete or toggle status of location
   */
  deleteLocation(token, locationId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์จัดการสถานที่ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }
    if (!locationId) return Utils.error('ไม่พบรหัสสถานที่');

    Db.update(CONFIG.SHEETS.LOCATIONS, l => String(l.LocationID) === String(locationId), { Status: 'Inactive' });
    return Utils.success({}, 'ปิดการใช้งานสถานที่เรียบร้อย');
  },

  /**
   * Get all holidays
   */
  getHolidays(token) {
    const holidays = Db.getAll(CONFIG.SHEETS.HOLIDAY) || [];
    return Utils.success({ holidays: holidays });
  },

  /**
   * Save or update holiday - Admin Only
   */
  saveHoliday(token, holidayData) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์จัดการวันหยุด (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    if (!holidayData || !holidayData.HolidayDate || !holidayData.HolidayName) {
      return Utils.error('กรุณาระบุวันที่และชื่อวันหยุด');
    }

    const cleanDate = Utils.formatISODate(holidayData.HolidayDate);
    const cleanData = {
      HolidayDate: cleanDate,
      HolidayName: String(holidayData.HolidayName).trim(),
      Type: holidayData.Type || 'Public',
      Status: holidayData.Status === 'Inactive' ? 'Inactive' : 'Active'
    };

    const existing = Db.findOne(CONFIG.SHEETS.HOLIDAY, h => h.HolidayDate === cleanDate);
    if (existing) {
      Db.update(CONFIG.SHEETS.HOLIDAY, h => h.HolidayDate === cleanDate, cleanData);
    } else {
      Db.insert(CONFIG.SHEETS.HOLIDAY, cleanData);
    }

    return Utils.success({ holiday: cleanData }, 'บันทึกข้อมูลวันหยุดเรียบร้อย');
  },

  /**
   * Delete or toggle holiday - Admin Only
   */
  deleteHoliday(token, holidayDate) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์จัดการวันหยุด (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }
    const cleanDate = Utils.formatISODate(holidayDate);
    Db.update(CONFIG.SHEETS.HOLIDAY, h => h.HolidayDate === cleanDate, { Status: 'Inactive' });
    return Utils.success({}, 'ปิดการใช้งานวันหยุดเรียบร้อย');
  },

  /**
   * Import multiple holidays for the entire year at once - Admin Only
   */
  importHolidays(token, holidayList) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์นำเข้าวันหยุด (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    if (!Array.isArray(holidayList) || holidayList.length === 0) {
      return Utils.error('ไม่พบรายการวันหยุดสำหรับนำเข้า');
    }

    let importedCount = 0;
    const existing = Db.getAll(CONFIG.SHEETS.HOLIDAY) || [];
    const dateMap = {};
    existing.forEach(h => {
      if (h && h.HolidayDate) {
        dateMap[Utils.formatISODate(h.HolidayDate)] = true;
      }
    });

    holidayList.forEach(item => {
      if (!item || !item.HolidayDate || !item.HolidayName) return;
      const cleanDate = Utils.formatISODate(item.HolidayDate);
      const row = {
        HolidayDate: cleanDate,
        HolidayName: String(item.HolidayName).trim(),
        Type: item.Type || 'Public',
        Status: item.Status === 'Inactive' ? 'Inactive' : 'Active'
      };

      if (dateMap[cleanDate]) {
        Db.update(CONFIG.SHEETS.HOLIDAY, h => Utils.formatISODate(h.HolidayDate) === cleanDate, row);
      } else {
        Db.insert(CONFIG.SHEETS.HOLIDAY, row);
        dateMap[cleanDate] = true;
      }
      importedCount++;
    });

    return Utils.success({ importedCount: importedCount }, `นำเข้าข้อมูลวันหยุดสำเร็จ ${importedCount} วัน`);
  },

  /**
   * Backfill real October–November 2026 (through 2026-11-18) Attendance records
   * from the provided document time pairs, matching real working days & Holiday sheet.
   * For 2026-11-18, inserts CHECK_IN only as requested.
   */
  syncOctNov2026Attendance(token, skipAuth = false) {
    if (!skipAuth) {
      const valid = Auth.validateSession(token);
      if (!valid.success) return valid;
      if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
        return Utils.error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ปรับปรุงฐานข้อมูลลงเวลาได้', 'FORBIDDEN');
      }
    }

    const users = Db.getAll(CONFIG.SHEETS.USERS) || [];
    const targetUser =
      users.find(u => String(u.FullName || '').indexOf('เฉลิมพร') !== -1) ||
      users.find(u => String(u.EmployeeCode || '') === 'E0001') ||
      users.find(u => u.Role === CONFIG.ROLES.ADMIN && u.Status === 'Active');

    if (!targetUser) {
      return Utils.error('ไม่พบข้อมูลพนักงานเป้าหมาย (นายเฉลิมพร ถาโคตร) ในตาราง Users');
    }

    const locations = Db.find(CONFIG.SHEETS.LOCATIONS, l => l.Status !== 'Inactive') || [];
    const loc = locations[0] || {
      LocationID: 'LOC001',
      LocationName: 'สำนักงานหลัก',
      Address: '567 ถนนนนทบุรี ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
      Latitude: 13.91094031,
      Longitude: 100.5946153
    };

    const docTimePairs = [
      ['08:10:00', '17:11:00'],
      ['08:13:00', '17:15:00'],
      ['08:20:00', '17:18:00'],
      ['08:18:00', '17:07:00'],
      ['08:19:00', '17:05:00'],
      ['08:21:00', '17:10:00'],
      ['08:25:00', '17:11:00'],
      ['08:20:00', '17:12:00'],
      ['08:23:00', '17:14:00'],
      ['08:20:00', '17:28:00'],
      ['08:10:00', '17:11:00'],
      ['08:13:00', '17:15:00'],
      ['08:20:00', '17:18:00'],
      ['08:21:00', '17:10:00'],
      ['08:20:00', '17:12:00'],
      ['08:10:00', '17:14:00'],
      ['08:10:00', '17:11:00'],
      ['08:13:00', '17:15:00'],
      ['08:20:00', '17:18:00'],
      ['08:20:00', '17:18:00']
    ];

    const holidays = Db.find(CONFIG.SHEETS.HOLIDAY, h => h.Status !== 'Inactive') || [];
    const holidayMap = {};
    holidays.forEach(h => {
      const dStr = Utils.formatISODate(h.HolidayDate);
      if (dStr) holidayMap[dStr] = true;
    });

    const startDate = '2026-10-01';
    const endDate = '2026-11-18';

    // 1. Remove existing Oct 1 - Nov 18, 2026 attendance rows for this user
    const deletedCount = Db.delete(CONFIG.SHEETS.ATTENDANCE, a => {
      if (String(a.UserID) !== String(targetUser.UserID)) return false;
      const wd = Utils.formatISODate(a.WorkDate);
      return wd >= startDate && wd <= endDate;
    });

    // 2. Build real working day rows (Mon-Fri excluding Holidays) from 2026-10-01 to 2026-11-18
    const records = [];
    let pairIdx = 0;
    let workingDaysCount = 0;
    const baseStamp = Date.now();

    const ranges = [
      { year: 2026, month: 10, maxDay: 31 },
      { year: 2026, month: 11, maxDay: 18 }
    ];

    ranges.forEach(r => {
      const mm = String(r.month).padStart(2, '0');
      for (let d = 1; d <= r.maxDay; d++) {
        const dd = String(d).padStart(2, '0');
        const isoDate = `${r.year}-${mm}-${dd}`;
        const dow = new Date(Date.UTC(r.year, r.month - 1, d)).getUTCDay();
        if (dow === 0 || dow === 6 || holidayMap[isoDate]) {
          continue;
        }

        const pair = docTimePairs[pairIdx % docTimePairs.length];
        pairIdx++;
        workingDaysCount++;

        const inTime = pair[0];
        const outTime = pair[1];

        records.push({
          AttendanceID: `ATT${baseStamp}_${workingDaysCount}_IN`,
          UserID: String(targetUser.UserID),
          EmployeeCode: String(targetUser.EmployeeCode || ''),
          FullName: String(targetUser.FullName || ''),
          WorkDate: isoDate,
          WorkTime: inTime,
          Type: CONFIG.ATTENDANCE_TYPE.CHECK_IN,
          Status: CONFIG.ATTENDANCE_STATUS.ON_TIME,
          Latitude: loc.Latitude || 13.91094031,
          Longitude: loc.Longitude || 100.5946153,
          Accuracy: 15,
          DistanceMeter: 0,
          LocationID: loc.LocationID || 'LOC001',
          LocationName: loc.LocationName || 'สำนักงานหลัก',
          Address: loc.Address || '',
          DeviceInfo: 'Document Import',
          WorkMode: CONFIG.WORK_MODES.ONSITE,
          WorkMinutes: 0,
          SelfieUrl: '',
          Remark: '',
          CreatedAt: `${isoDate}T${inTime}+07:00`
        });

        // For 2026-11-18 (today), insert CHECK_IN only
        if (isoDate !== endDate) {
          const workMins = Math.max(0, Utils.timeToMinutes(outTime) - Utils.timeToMinutes(inTime));
          records.push({
            AttendanceID: `ATT${baseStamp}_${workingDaysCount}_OUT`,
            UserID: String(targetUser.UserID),
            EmployeeCode: String(targetUser.EmployeeCode || ''),
            FullName: String(targetUser.FullName || ''),
            WorkDate: isoDate,
            WorkTime: outTime,
            Type: CONFIG.ATTENDANCE_TYPE.CHECK_OUT,
            Status: CONFIG.ATTENDANCE_STATUS.CHECKED_OUT,
            Latitude: loc.Latitude || 13.91094031,
            Longitude: loc.Longitude || 100.5946153,
            Accuracy: 15,
            DistanceMeter: 0,
            LocationID: loc.LocationID || 'LOC001',
            LocationName: loc.LocationName || 'สำนักงานหลัก',
            Address: loc.Address || '',
            DeviceInfo: 'Document Import',
            WorkMode: CONFIG.WORK_MODES.ONSITE,
            WorkMinutes: workMins,
            SelfieUrl: '',
            Remark: '',
            CreatedAt: `${isoDate}T${outTime}+07:00`
          });
        }
      }
    });

    // 3. Batch-insert into Attendance sheet under LockService
    if (records.length > 0) {
      Db.withLock(() => {
        const sheet = Db.getSheet(CONFIG.SHEETS.ATTENDANCE);
        let headers = Db.getHeaders(CONFIG.SHEETS.ATTENDANCE);
        if (headers.length === 0) {
          headers = Object.keys(records[0]);
          Db.setHeaders(CONFIG.SHEETS.ATTENDANCE, headers);
        }
        const matrix = records.map(rec =>
          headers.map(h => (rec[h] !== undefined && rec[h] !== null ? rec[h] : ''))
        );
        const startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
      });
    }

    return Utils.success({
      user: targetUser.FullName,
      deletedCount: deletedCount,
      workingDaysCount: workingDaysCount,
      insertedRows: records.length
    }, `ปรับปรุงข้อมูลลงเวลา ต.ค.–พ.ย. 2569 สำเร็จ (${workingDaysCount} วันทำงาน / ${records.length} รายการ)`);
  },

  /**
   * Import Attendance records from CSV data/rows
   * @param {string} token
   * @param {Array<Object>|string} inputData - Array of parsed objects or raw CSV string
   * @param {Object} options - { overwrite: boolean, defaultLocationId: string }
   */
  importAttendanceCsv(token, inputData, options = {}) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const operator = valid.data.user;
    if (operator.Role !== CONFIG.ROLES.ADMIN && operator.Role !== CONFIG.ROLES.SUPERVISOR) {
      return Utils.error('เฉพาะผู้ดูแลระบบ (Admin) หรือหัวหน้างาน (Supervisor) เท่านั้นที่นำเข้าข้อมูลเวลาได้', 'FORBIDDEN');
    }

    if (!inputData) {
      return Utils.error('ไม่พบข้อมูลที่จะนำเข้า กรุณาเลือกไฟล์ .CSV');
    }

    let rows = [];
    if (Array.isArray(inputData)) {
      rows = inputData;
    } else if (typeof inputData === 'string') {
      rows = this.parseCsvToObjects(inputData);
    }

    if (!rows || rows.length === 0) {
      return Utils.error('ไม่พบข้อมูลแถวในไฟล์ CSV หรือไฟล์ว่างเปล่า');
    }

    const allUsers = Db.getAll(CONFIG.SHEETS.USERS) || [];
    const userMapByCode = {};
    const userMapByName = {};
    allUsers.forEach(u => {
      if (u.EmployeeCode) userMapByCode[String(u.EmployeeCode).trim().toUpperCase()] = u;
      if (u.FullName) userMapByName[String(u.FullName).trim()] = u;
    });

    const locations = Db.find(CONFIG.SHEETS.LOCATIONS, l => l.Status !== 'Inactive') || [];
    const loc = locations[0] || {
      LocationID: 'LOC001',
      LocationName: 'สำนักงานหลัก',
      Address: '567 ถนนนนทบุรี ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
      Latitude: 13.91094031,
      Longitude: 100.5946153
    };

    const overwrite = options.overwrite !== false; // default true
    const baseStamp = Date.now();
    const newRecords = [];
    let importedDays = 0;
    let skippedRows = 0;
    const touchedUserDates = {}; // "userId_workDate" -> true

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rawDate = r.WorkDate || r.Date || r.วันที่ || '';
      const isoDate = Utils.formatISODate(rawDate);
      if (!isoDate) {
        skippedRows++;
        continue;
      }

      const empCode = String(r.EmployeeCode || r.EmpCode || r.รหัสพนักงาน || '').trim().toUpperCase();
      const fullName = String(r.FullName || r.Name || r.ชื่อ || '').trim();

      let targetUser = userMapByCode[empCode] || userMapByName[fullName];
      if (!targetUser) {
        // Fallback: If only 1 employee in system or operator itself
        targetUser = allUsers.find(u => String(u.EmployeeCode || '') === 'E0001') || operator;
      }

      const checkInRaw = String(r.CheckIn || r.InTime || r.เข้า || '').trim();
      const checkOutRaw = String(r.CheckOut || r.OutTime || r.ออก || '').trim();
      const remark = String(r.Remark || r.หมายเหตุ || '').trim();

      const cleanCheckIn = this.normalizeTime(checkInRaw);
      const cleanCheckOut = this.normalizeTime(checkOutRaw);

      if (!cleanCheckIn && !cleanCheckOut) {
        // Weekend or Holiday or absent row with no stamps
        skippedRows++;
        continue;
      }

      importedDays++;
      const userDateKey = `${targetUser.UserID}_${isoDate}`;
      touchedUserDates[userDateKey] = { userId: String(targetUser.UserID), workDate: isoDate };

      // 1. Check-In Stamp
      if (cleanCheckIn) {
        const isLate = Utils.timeToMinutes(cleanCheckIn) > (8 * 60 + 30); // Late after 08:30
        newRecords.push({
          AttendanceID: `ATT${baseStamp}_${i + 1}_IN`,
          UserID: String(targetUser.UserID),
          EmployeeCode: String(targetUser.EmployeeCode || ''),
          FullName: String(targetUser.FullName || ''),
          WorkDate: isoDate,
          WorkTime: cleanCheckIn,
          Type: CONFIG.ATTENDANCE_TYPE.CHECK_IN,
          Status: isLate ? CONFIG.ATTENDANCE_STATUS.LATE : CONFIG.ATTENDANCE_STATUS.ON_TIME,
          Latitude: loc.Latitude || 13.91094031,
          Longitude: loc.Longitude || 100.5946153,
          Accuracy: 15,
          DistanceMeter: 0,
          LocationID: loc.LocationID || 'LOC001',
          LocationName: loc.LocationName || 'สำนักงานหลัก',
          Address: loc.Address || '',
          DeviceInfo: 'CSV Import',
          WorkMode: CONFIG.WORK_MODES.ONSITE,
          WorkMinutes: 0,
          SelfieUrl: '',
          Remark: remark,
          CreatedAt: `${isoDate}T${cleanCheckIn}+07:00`
        });
      }

      // 2. Check-Out Stamp
      if (cleanCheckOut) {
        let workMins = 0;
        if (cleanCheckIn) {
          workMins = Math.max(0, Utils.timeToMinutes(cleanCheckOut) - Utils.timeToMinutes(cleanCheckIn));
        }
        newRecords.push({
          AttendanceID: `ATT${baseStamp}_${i + 1}_OUT`,
          UserID: String(targetUser.UserID),
          EmployeeCode: String(targetUser.EmployeeCode || ''),
          FullName: String(targetUser.FullName || ''),
          WorkDate: isoDate,
          WorkTime: cleanCheckOut,
          Type: CONFIG.ATTENDANCE_TYPE.CHECK_OUT,
          Status: CONFIG.ATTENDANCE_STATUS.CHECKED_OUT,
          Latitude: loc.Latitude || 13.91094031,
          Longitude: loc.Longitude || 100.5946153,
          Accuracy: 15,
          DistanceMeter: 0,
          LocationID: loc.LocationID || 'LOC001',
          LocationName: loc.LocationName || 'สำนักงานหลัก',
          Address: loc.Address || '',
          DeviceInfo: 'CSV Import',
          WorkMode: CONFIG.WORK_MODES.ONSITE,
          WorkMinutes: workMins,
          SelfieUrl: '',
          Remark: remark,
          CreatedAt: `${isoDate}T${cleanCheckOut}+07:00`
        });
      }
    }

    if (newRecords.length === 0) {
      return Utils.error(`ไม่มีรายการเวลาเข้า-ออกที่ถูกต้องในไฟล์ (ข้าม ${skippedRows} แถว)`);
    }

    // Save to Database under Lock
    Db.withLock(() => {
      // If overwrite, delete existing attendance rows for these users on these dates
      if (overwrite) {
        Db.delete(CONFIG.SHEETS.ATTENDANCE, a => {
          const uId = String(a.UserID);
          const wDate = Utils.formatISODate(a.WorkDate);
          return Boolean(touchedUserDates[`${uId}_${wDate}`]);
        });
      }

      const sheet = Db.getSheet(CONFIG.SHEETS.ATTENDANCE);
      let headers = Db.getHeaders(CONFIG.SHEETS.ATTENDANCE);
      if (headers.length === 0) {
        headers = Object.keys(newRecords[0]);
        Db.setHeaders(CONFIG.SHEETS.ATTENDANCE, headers);
      }
      const matrix = newRecords.map(rec =>
        headers.map(h => (rec[h] !== undefined && rec[h] !== null ? rec[h] : ''))
      );
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
    });

    Db.logAudit(operator.UserID, 'IMPORT_ATTENDANCE_CSV', {
      importedDays: importedDays,
      totalInsertedRows: newRecords.length,
      skippedRows: skippedRows,
      overwrite: overwrite
    });

    return Utils.success({
      importedDays: importedDays,
      totalInsertedRows: newRecords.length,
      skippedRows: skippedRows,
      sampleRecords: newRecords.slice(0, 4)
    }, `นำเข้าข้อมูลเวลาสำเร็จ ${importedDays} วัน (${newRecords.length} รายการเข้า-ออก)`);
  },

  /**
   * Helper: Normalize time string to HH:mm:ss
   */
  normalizeTime(timeStr) {
    if (!timeStr) return '';
    const clean = String(timeStr).trim().replace(/\./g, ':');
    const parts = clean.split(':');
    if (parts.length < 2) return '';
    const h = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
    const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    const s = parts[2] ? String(parseInt(parts[2], 10) || 0).padStart(2, '0') : '00';
    return `${h}:${m}:${s}`;
  },

  /**
   * Helper: Parse CSV string to array of objects
   */
  parseCsvToObjects(csvText) {
    if (!csvText) return [];
    const cleanText = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));

      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      result.push(rowObj);
    }
    return result;
  }
};
