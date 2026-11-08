/**
 * File: Workflow.gs
 * Description: Time Correction & Overtime Request Workflow with Supervisor Approvals.
 */

const Workflow = {
  /**
   * Submit Time Correction Request (ลืมลงเวลา / ปรับปรุงเวลา)
   */
  submitCorrection(token, data) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (!data.targetDate || !data.correctTime || !data.reason) {
      return Utils.error('กรุณาระบุวันที่ เวลา และเหตุผลที่ต้องการปรับปรุง');
    }

    const reqId = 'CORR' + Date.now();
    const newReq = {
      RequestID: reqId,
      UserID: user.UserID,
      EmployeeCode: user.EmployeeCode,
      FullName: user.FullName,
      TargetDate: data.targetDate,
      CorrectTime: data.correctTime,
      Type: data.type || 'CHECK_IN',
      Reason: data.reason,
      Status: 'Pending',
      ApproverID: '',
      ApproverComment: '',
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.CORRECTIONS, newReq);
    Notify.sendInApp(user.UserID, 'ยื่นคำขอปรับปรุงเวลาแล้ว', `คำขอวันที่ ${data.targetDate} อยู่ระหว่างรอหัวหน้างานพิจารณา`, 'WORKFLOW');

    return Utils.success({ request: newReq }, 'ส่งคำขอปรับปรุงเวลาเรียบร้อยแล้ว');
  },

  /**
   * Submit Overtime Request (ขอทำงานล่วงเวลา OT)
   */
  submitOvertime(token, data) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (!data.otDate || !data.startTime || !data.endTime || !data.reason) {
      return Utils.error('กรุณาระบุวันที่ เวลาเริ่ม เวลาสิ้นสุด และเหตุผล');
    }

    const startMin = Utils.timeToMinutes(data.startTime);
    const endMin = Utils.timeToMinutes(data.endTime);
    const totalHours = Math.max(0, ((endMin - startMin) / 60)).toFixed(1);

    const reqId = 'OT' + Date.now();
    const newReq = {
      RequestID: reqId,
      UserID: user.UserID,
      EmployeeCode: user.EmployeeCode,
      FullName: user.FullName,
      OTDate: data.otDate,
      StartTime: data.startTime,
      EndTime: data.endTime,
      TotalHours: totalHours,
      Reason: data.reason,
      Status: 'Pending',
      ApproverID: '',
      ApproverComment: '',
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.OVERTIME, newReq);
    Notify.sendInApp(user.UserID, 'ยื่นคำขอทำ OT แล้ว', `คำขอทำ OT ${totalHours} ชม. อยู่ระหว่างรอการอนุมัติ`, 'WORKFLOW');

    return Utils.success({ request: newReq }, 'ส่งคำขอทำงานล่วงเวลา (OT) เรียบร้อยแล้ว');
  },

  /**
   * Get Requests for User or Approver
   */
  getRequests(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let corrections = [];
    let overtimes = [];

    if (user.Role === CONFIG.ROLES.ADMIN || user.Role === CONFIG.ROLES.SUPERVISOR) {
      corrections = Db.getAll(CONFIG.SHEETS.CORRECTIONS);
      overtimes = Db.getAll(CONFIG.SHEETS.OVERTIME);
    } else {
      corrections = Db.find(CONFIG.SHEETS.CORRECTIONS, c => c.UserID === user.UserID);
      overtimes = Db.find(CONFIG.SHEETS.OVERTIME, o => o.UserID === user.UserID);
    }

    return Utils.success({
      corrections: corrections,
      overtimes: overtimes
    });
  },

  /**
   * Approve or Reject Request
   */
  reviewRequest(token, requestId, type, status, comment = '') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (user.Role !== CONFIG.ROLES.ADMIN && user.Role !== CONFIG.ROLES.SUPERVISOR) {
      return Utils.error('คุณไม่มีสิทธิ์ในการอนุมัติคำขอ', 'FORBIDDEN');
    }

    const targetSheet = type === 'CORRECTION' ? CONFIG.SHEETS.CORRECTIONS : CONFIG.SHEETS.OVERTIME;
    const updatedCount = Db.update(targetSheet, r => r.RequestID === requestId, {
      Status: status,
      ApproverID: user.UserID,
      ApproverComment: comment
    });

    if (updatedCount > 0) {
      const req = Db.findOne(targetSheet, r => r.RequestID === requestId);
      if (req) {
        Notify.sendInApp(req.UserID, `ผลการพิจารณาคำขอ (${status})`, `คำขอ ${req.RequestID} ได้รับการ ${status === 'Approved' ? 'อนุมัติ' : 'ปฏิเสธ'} แล้ว`, 'WORKFLOW');
      }
      return Utils.success({}, `ดำเนินการ ${status} คำขอเรียบร้อย`);
    }

    return Utils.error('ไม่พบคำขอที่ระบุ');
  }
};
