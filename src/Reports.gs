/**
 * Project: Time Stamp Attendances : TSA V1.0.43
 * File: Reports.gs
 * Description: Timesheet aggregation, Monthly Summaries, and CSV Payroll Export.
 * Version: 1.0.43
 * Author: TSA Engineering Team
 * Last Updated: 2026-11-18
 */

const Reports = {
  /**
   * Get Monthly Summary for Employee or Admin
   */
  getMonthlySummary(token, year, month) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    const y = year || new Date().getFullYear();
    const m = String(month || (new Date().getMonth() + 1)).padStart(2, '0');
    const prefix = `${y}-${m}`;

    const logs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => a.UserID === user.UserID && String(a.WorkDate).startsWith(prefix));

    const totalDaysWorked = new Set(logs.map(l => l.WorkDate)).size;
    const lateDays = logs.filter(l => l.Status === CONFIG.ATTENDANCE_STATUS.LATE).length;
    const earlyLeaves = logs.filter(l => l.Status === CONFIG.ATTENDANCE_STATUS.EARLY_LEAVE).length;

    const ots = Db.find(CONFIG.SHEETS.OVERTIME, o => o.UserID === user.UserID && String(o.OTDate).startsWith(prefix) && o.Status === 'Approved');
    const totalOTHours = ots.reduce((acc, cur) => acc + (Number(cur.TotalHours) || 0), 0);

    return Utils.success({
      year: y,
      month: m,
      totalDaysWorked: totalDaysWorked,
      lateDays: lateDays,
      earlyLeaves: earlyLeaves,
      totalOTHours: totalOTHours.toFixed(1),
      logsCount: logs.length
    });
  },

  /**
   * Export Timesheet as CSV string
   */
  exportCSV(token, year, month) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (user.Role !== CONFIG.ROLES.ADMIN && user.Role !== CONFIG.ROLES.SUPERVISOR) {
      return Utils.error('คุณไม่มีสิทธิ์ในการส่งออกรายงาน', 'FORBIDDEN');
    }

    const y = year || new Date().getFullYear();
    const m = String(month || (new Date().getMonth() + 1)).padStart(2, '0');
    const prefix = `${y}-${m}`;

    const logs = Db.find(CONFIG.SHEETS.ATTENDANCE, a => String(a.WorkDate).startsWith(prefix));
    logs.sort((a, b) => a.WorkDate.localeCompare(b.WorkDate) || a.WorkTime.localeCompare(b.WorkTime));

    const headers = ['รหัสพนักงาน', 'ชื่อ-สกุล', 'วันที่', 'เวลา', 'ประเภท', 'สถานะ', 'โหมดการทำงาน', 'สถานที่', 'ระยะห่าง(ม.)', 'หมายเหตุ'];
    const rows = [headers.join(',')];

    logs.forEach(l => {
      const row = [
        `"${l.EmployeeCode || ''}"`,
        `"${l.FullName || ''}"`,
        `"${l.WorkDate || ''}"`,
        `"${l.WorkTime || ''}"`,
        `"${l.Type || ''}"`,
        `"${l.Status || ''}"`,
        `"${l.WorkMode || ''}"`,
        `"${l.LocationName || ''}"`,
        `"${l.DistanceMeter || 0}"`,
        `"${(l.Remark || '').replace(/"/g, '""')}"`
      ];
      rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n'); // Add BOM for Excel UTF-8 support
    return Utils.success({
      csv: csvContent,
      filename: `Timesheet_${prefix}.csv`
    });
  },

  /**
   * Default customizable template config for Monthly Attendance Report Form
   */
  getDefaultFormConfig() {
    return {
      logoUrl: '',
      reportTitle: 'ใบบันทึกเวลาการมาปฏิบัติงานของเจ้าหน้าที่ ' + (CONFIG.APP_ORGANIZATION_EN || 'Time Stamp Attendances'),
      projectName: 'โครงการบันทึกเวลาปฏิบัติงานและลงเวลาเข้า-ออกงานออนไลน์',
      contractNo: '',
      signerLabel: 'ลายเซ็นต์เจ้าหน้าที่'
    };
  },

  /**
   * Load saved Report Form Config from ScriptProperties
   */
  readFormConfig() {
    const defaults = this.getDefaultFormConfig();
    try {
      const raw = PropertiesService.getScriptProperties().getProperty('REPORT_FORM_CONFIG');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign({}, defaults, parsed || {});
      }
    } catch (e) {}
    return defaults;
  },

  /**
   * Get Report Form Config (any authenticated user)
   */
  getReportFormConfig(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    return Utils.success({ config: this.readFormConfig() });
  },

  /**
   * Save Report Form Config (Admin only; supports Logo upload to Drive)
   */
  saveReportFormConfig(token, cfg = {}) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่แก้ไขแบบฟอร์มรายงานได้', 'FORBIDDEN');
    }

    const current = this.readFormConfig();
    let logoUrl = current.logoUrl || '';

    if (cfg.clearLogo) {
      logoUrl = '';
    } else if (cfg.logoBase64) {
      const uploaded = Files.uploadReportLogo(cfg.logoBase64);
      if (uploaded && uploaded.shared && uploaded.imageUrl) {
        logoUrl = uploaded.imageUrl;
      } else if (String(cfg.logoBase64).length <= 7000) {
        logoUrl = String(cfg.logoBase64);
      } else if (uploaded && uploaded.imageUrl) {
        logoUrl = uploaded.imageUrl;
      } else {
        return Utils.error('ไม่สามารถอัปโหลดโลโก้ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } else if (cfg.logoUrl !== undefined) {
      logoUrl = String(cfg.logoUrl || '').trim();
    }

    const nextCfg = {
      logoUrl: logoUrl,
      reportTitle: String(cfg.reportTitle !== undefined ? cfg.reportTitle : current.reportTitle).trim() || current.reportTitle,
      projectName: String(cfg.projectName !== undefined ? cfg.projectName : current.projectName).trim(),
      contractNo: String(cfg.contractNo !== undefined ? cfg.contractNo : current.contractNo).trim(),
      signerLabel: String(cfg.signerLabel !== undefined ? cfg.signerLabel : current.signerLabel).trim() || 'ลายเซ็นต์เจ้าหน้าที่'
    };

    PropertiesService.getScriptProperties().setProperty('REPORT_FORM_CONFIG', JSON.stringify(nextCfg));
    return Utils.success({ config: nextCfg }, 'บันทึกการตั้งค่าแบบฟอร์มรายงานเรียบร้อยแล้ว');
  },

  /**
   * Format HH:mm:ss or HH:mm into Thai "HH:mm น."
   */
  formatReportTime(rawTime) {
    const str = String(rawTime || '').trim();
    if (!str) return '';
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return str;
    return `${match[1].padStart(2, '0')}:${match[2]} น.`;
  },

  /**
   * Build full monthly printable attendance report from real Users, Attendance, and Holiday data
   */
  getMonthlyAttendanceReport(token, year, month, targetUserId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const requester = valid.data.user;
    const isAdminOrSup = (requester.Role === CONFIG.ROLES.ADMIN || requester.Role === CONFIG.ROLES.SUPERVISOR);

    // Resolve target employee (Admin/Supervisor can inspect any active employee)
    let targetUser = requester;
    let employeesList = [];
    if (isAdminOrSup) {
      const allUsers = Db.find(CONFIG.SHEETS.USERS, u => u.Status === 'Active') || [];
      employeesList = allUsers.map(u => ({
        UserID: String(u.UserID || ''),
        EmployeeCode: String(u.EmployeeCode || ''),
        FullName: String(u.FullName || ''),
        Position: String(u.Position || ''),
        DepartmentID: String(u.DepartmentID || '')
      }));
      if (targetUserId) {
        const found = allUsers.find(u => String(u.UserID) === String(targetUserId));
        if (found) targetUser = found;
      }
    }

    const nowBkk = new Date(Date.now() + 7 * 3600 * 1000);
    const y = Number(year) || nowBkk.getUTCFullYear();
    const m = Number(month) || (nowBkk.getUTCMonth() + 1);
    const mm = String(m).padStart(2, '0');
    const prefix = `${y}-${mm}`;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const beYear = y + 543;

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthNameThai = thaiMonths[m - 1] || '';

    // Group real attendance logs by WorkDate for target employee
    const logs = Db.find(CONFIG.SHEETS.ATTENDANCE, a =>
      String(a.UserID) === String(targetUser.UserID) &&
      Utils.formatISODate(a.WorkDate).startsWith(prefix)
    ) || [];

    const dayLogsMap = {};
    logs.forEach(l => {
      const dKey = Utils.formatISODate(l.WorkDate);
      if (!dayLogsMap[dKey]) {
        dayLogsMap[dKey] = { checkIns: [], checkOuts: [], remarks: [] };
      }
      const timeStr = String(l.WorkTime || '').trim();
      if (l.Type === CONFIG.ATTENDANCE_TYPE.CHECK_IN && timeStr) {
        dayLogsMap[dKey].checkIns.push(timeStr);
      } else if (l.Type === CONFIG.ATTENDANCE_TYPE.CHECK_OUT && timeStr) {
        dayLogsMap[dKey].checkOuts.push(timeStr);
      }
      if (l.Remark) {
        const cleanRem = String(l.Remark).trim();
        if (cleanRem && dayLogsMap[dKey].remarks.indexOf(cleanRem) === -1) {
          dayLogsMap[dKey].remarks.push(cleanRem);
        }
      }
    });

    // Map real active holidays for the month
    const holidays = Db.find(CONFIG.SHEETS.HOLIDAY, h =>
      h.Status !== 'Inactive' &&
      Utils.formatISODate(h.HolidayDate).startsWith(prefix)
    ) || [];

    const holidayMap = {};
    holidays.forEach(h => {
      const hKey = Utils.formatISODate(h.HolidayDate);
      if (hKey) {
        holidayMap[hKey] = {
          name: String(h.HolidayName || '').trim(),
          type: String(h.Type || 'Public').trim()
        };
      }
    });

    const rows = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const isoDate = `${prefix}-${dd}`;
      const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay(); // 0=Sun, 6=Sat
      const isWeekend = (dow === 0 || dow === 6);
      const holiday = holidayMap[isoDate] || null;
      const logEntry = dayLogsMap[isoDate] || null;

      let checkInTime = '';
      let checkOutTime = '';
      if (logEntry) {
        const sortByTime = (a, b) => {
          const diff = Utils.timeToMinutes(a) - Utils.timeToMinutes(b);
          return diff !== 0 ? diff : String(a).localeCompare(String(b));
        };
        if (logEntry.checkIns.length > 0) {
          logEntry.checkIns.sort(sortByTime);
          checkInTime = this.formatReportTime(logEntry.checkIns[0]);
        }
        if (logEntry.checkOuts.length > 0) {
          logEntry.checkOuts.sort(sortByTime);
          checkOutTime = this.formatReportTime(logEntry.checkOuts[logEntry.checkOuts.length - 1]);
        }
      }

      const hasWorked = Boolean(checkInTime || checkOutTime);
      let dayType = 'WORKDAY';
      let mergedLabel = '';
      let remark = '';

      if (hasWorked) {
        dayType = 'WORKED';
        const parts = [];
        if (holiday && holiday.name) parts.push(holiday.name);
        if (logEntry && logEntry.remarks.length > 0) parts.push(logEntry.remarks.join(', '));
        remark = parts.join(' - ');
      } else if (holiday) {
        dayType = 'HOLIDAY';
        mergedLabel = holiday.type === 'Company' ? 'วันหยุดบริษัท' : 'วันหยุดราชการ';
        remark = holiday.name || '';
      } else if (isWeekend) {
        dayType = 'WEEKEND';
        mergedLabel = 'วันหยุดประจำสัปดาห์';
      }

      rows.push({
        day: day,
        isoDate: isoDate,
        displayDate: `${day}/${m}/${beYear}`,
        employeeName: String(targetUser.FullName || ''),
        dayType: dayType,
        mergedLabel: mergedLabel,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        remark: remark
      });
    }

    return Utils.success({
      config: this.readFormConfig(),
      employee: {
        UserID: String(targetUser.UserID || ''),
        EmployeeCode: String(targetUser.EmployeeCode || ''),
        FullName: String(targetUser.FullName || ''),
        Position: String(targetUser.Position || ''),
        DepartmentID: String(targetUser.DepartmentID || '')
      },
      employees: employeesList,
      canCustomize: requester.Role === CONFIG.ROLES.ADMIN,
      canSelectEmployee: isAdminOrSup,
      period: {
        year: y,
        month: m,
        beYear: beYear,
        monthNameThai: monthNameThai,
        label: `ประจำเดือน ${monthNameThai} ${beYear}`
      },
      rows: rows
    });
  }
};
