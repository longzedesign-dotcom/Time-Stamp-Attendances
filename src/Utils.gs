/**
 * File: Utils.gs
 * Description: Helper functions for GPS calculation, Thai formatting, Hashing, and Response wrapping.
 */

const Utils = {
  /**
   * Calculate Haversine distance between two GPS coordinates in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  /**
   * Format Date to Thai Buddhist Era Date string: e.g. "13 กรกฎาคม 2569"
   */
  formatThaiDate(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  },

  /**
   * Format Date with Day of Week: e.g. "วันจันทร์ 13 กรกฎาคม 2569"
   */
  formatThaiFullDate(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    const thaiDays = [
      'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
    ];
    return `${thaiDays[date.getDay()]} ${this.formatThaiDate(date)}`;
  },

  /**
   * Format Time: e.g. "08:32"
   */
  formatTime(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * Format Thai Date Time: e.g. "09 กรกฎาคม 2569 08:32"
   */
  formatThaiDateTime(dateObj) {
    if (!dateObj) return '';
    return `${this.formatThaiDate(dateObj)} ${this.formatTime(dateObj)}`;
  },

  /**
   * Get Standard ISO Date string: "YYYY-MM-DD"
   */
  formatISODate(dateObj) {
    const d = new Date(dateObj || new Date());
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Generate SHA-256 Hash with Salt
   */
  hashPassword(password) {
    const raw = password + CONFIG.SECURITY.SALT;
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    return signature.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  },

  /**
   * Generate a random Secure Token
   */
  generateToken() {
    return Utilities.getUuid() + '-' + Date.now().toString(36);
  },

  /**
   * Parse "HH:mm" into minutes from midnight
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  },

  /**
   * Determine late status and minutes
   */
  checkLateStatus(clockInTimeStr, shiftStartStr) {
    const clockInMin = this.timeToMinutes(clockInTimeStr);
    const shiftStartMin = this.timeToMinutes(shiftStartStr || CONFIG.DEFAULTS.WORK_START);
    const diff = clockInMin - shiftStartMin;
    if (diff > CONFIG.DEFAULTS.LATE_GRACE_MINUTES) {
      return { isLate: true, lateMinutes: diff };
    }
    return { isLate: false, lateMinutes: 0 };
  },

  /**
   * Determine early leave status and minutes
   */
  checkEarlyLeaveStatus(clockOutTimeStr, shiftEndStr) {
    const clockOutMin = this.timeToMinutes(clockOutTimeStr);
    const shiftEndMin = this.timeToMinutes(shiftEndStr || CONFIG.DEFAULTS.WORK_END);
    const diff = shiftEndMin - clockOutMin;
    if (diff > 0) {
      return { isEarly: true, earlyMinutes: diff };
    }
    return { isEarly: false, earlyMinutes: 0 };
  },

  /**
   * Success Response
   */
  success(data, message = 'Success') {
    return {
      success: true,
      data: data,
      message: message,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Error Response
   */
  error(message = 'An error occurred', code = 'ERROR') {
    return {
      success: false,
      error: {
        code: code,
        message: message
      },
      timestamp: new Date().toISOString()
    };
  }
};
