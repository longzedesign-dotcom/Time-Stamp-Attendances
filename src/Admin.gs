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
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    return Utils.success({ locations: Db.getAll(CONFIG.SHEETS.LOCATIONS) });
  },

  /**
   * Add or update location
   */
  saveLocation(token, locationData) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์จัดการสถานที่', 'FORBIDDEN');
    }

    const locId = locationData.LocationID || ('LOC' + Date.now());
    const existing = Db.findOne(CONFIG.SHEETS.LOCATIONS, l => l.LocationID === locId);

    if (existing) {
      Db.update(CONFIG.SHEETS.LOCATIONS, l => l.LocationID === locId, locationData);
    } else {
      locationData.LocationID = locId;
      Db.insert(CONFIG.SHEETS.LOCATIONS, locationData);
    }

    return Utils.success({ location: locationData }, 'บันทึกข้อมูลสถานที่เรียบร้อย');
  }
};
