/**
 * File: Reports.gs
 * Description: Timesheet aggregation, Monthly Summaries, and CSV Payroll Export.
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
  }
};
