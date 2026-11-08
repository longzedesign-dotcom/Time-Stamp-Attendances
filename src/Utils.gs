/**
 * File: Utils.gs
 * Description: Enterprise Utility Engine for GPS calculation, Accuracy Buffers, Time Windows, and Formatting.
 */

const Utils = {
  /**
   * Calculate Haversine distance between two GPS coordinates in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371000; // Earth radius in meters
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
   * Enterprise Geofence evaluation with Dynamic Accuracy Buffer
   * Prevents false rejections caused by satellite drift inside buildings.
   */
  evaluateGeofence(distanceMeters, radiusMeters, accuracyMeters) {
    const radius = Number(radiusMeters) || CONFIG.GPS.DEFAULT_LOCATION_RADIUS_METERS;
    const accuracy = Number(accuracyMeters) || 30;

    const buffer = Math.min(
      CONFIG.GPS.GEOFENCE_ACCURACY_BUFFER_MAX_METERS,
      Math.round(accuracy * CONFIG.GPS.GEOFENCE_ACCURACY_BUFFER_FACTOR)
    );

    const effectiveRadius = radius + buffer;
    const isInside = distanceMeters <= effectiveRadius;

    return {
      isInside: isInside,
      distanceMeters: distanceMeters,
      effectiveRadius: effectiveRadius,
      bufferMeters: buffer
    };
  },

  /**
   * Evaluate Attendance Time Window
   */
  evaluateTimeWindow(type, timeStr) {
    const curMin = this.timeToMinutes(timeStr);
    const tw = CONFIG.TIME_WINDOWS;

    if (type === CONFIG.ATTENDANCE_TYPE.CHECK_IN) {
      const startMin = this.timeToMinutes(tw.CHECK_IN_START);
      const normalEndMin = this.timeToMinutes(tw.NORMAL_UNTIL);
      const checkInEndMin = this.timeToMinutes(tw.CHECK_IN_END);

      if (curMin < startMin) {
        return { allowed: false, message: `ยังไม่ถึงเวลาเริ่มลงเวลาเข้างาน (เริ่ม ${tw.CHECK_IN_START} น.)` };
      }
      if (curMin > checkInEndMin) {
        return { allowed: false, message: `เกินเวลาลงเวลาเข้างานประจำวันแล้ว (สิ้นสุด ${tw.CHECK_IN_END} น.) กรุณาส่งคำขอปรับปรุงเวลา` };
      }

      if (curMin <= normalEndMin) {
        return { allowed: true, status: CONFIG.ATTENDANCE_STATUS.ON_TIME, lateMinutes: 0 };
      } else {
        const lateMinutes = curMin - normalEndMin;
        return { allowed: true, status: CONFIG.ATTENDANCE_STATUS.LATE, lateMinutes: lateMinutes };
      }
    } else {
      // Check Out
      const outStartMin = this.timeToMinutes(tw.CHECK_OUT_START);
      const outEndMin = this.timeToMinutes(tw.CHECK_OUT_END);

      if (curMin < outStartMin) {
        return { allowed: false, message: `ยังไม่ถึงเวลาลงเวลาออกงาน (เริ่ม ${tw.CHECK_OUT_START} น.)` };
      }
      if (curMin > outEndMin) {
        return { allowed: false, message: `เกินช่วงเวลาลงเวลาออกงานแล้ว (${tw.CHECK_OUT_END} น.)` };
      }

      const standardEndMin = this.timeToMinutes(CONFIG.TIME_WINDOWS.NORMAL_UNTIL === '08:30' ? '16:30' : '17:00');
      if (curMin < standardEndMin) {
        const earlyMinutes = standardEndMin - curMin;
        return { allowed: true, status: CONFIG.ATTENDANCE_STATUS.EARLY_LEAVE, earlyMinutes: earlyMinutes };
      }
      return { allowed: true, status: CONFIG.ATTENDANCE_STATUS.CHECKED_OUT, earlyMinutes: 0 };
    }
  },

  formatThaiDate(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  },

  formatThaiFullDate(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return `${thaiDays[date.getDay()]} ${this.formatThaiDate(date)}`;
  },

  formatTime(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  formatThaiDateTime(dateObj) {
    if (!dateObj) return '';
    return `${this.formatThaiDate(dateObj)} ${this.formatTime(dateObj)}`;
  },

  formatISODate(dateObj) {
    const d = new Date(dateObj || new Date());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  hashPassword(password) {
    const raw = password + CONFIG.SECURITY.SALT;
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    return signature.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  },

  generateToken() {
    return Utilities.getUuid() + '-' + Date.now().toString(36);
  },

  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  },

  success(data, message = 'Success') {
    return {
      success: true,
      data: data,
      message: message,
      timestamp: new Date().toISOString()
    };
  },

  error(message = 'An error occurred', code = 'ERROR') {
    return {
      success: false,
      error: { code: code, message: message },
      timestamp: new Date().toISOString()
    };
  }
};
