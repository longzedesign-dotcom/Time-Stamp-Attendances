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
  }
};
