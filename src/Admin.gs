/**
 * File: Admin.gs
 * Description: Administrative management for Users, Locations, and System Configuration.
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
  }
};
