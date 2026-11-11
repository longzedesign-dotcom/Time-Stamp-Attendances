/**
 * File: Notify.gs
 * Description: Notifications management (In-app alerts and Email notifications).
 */

const Notify = {
  /**
   * Send In-App Notification
   */
  sendInApp(userId, title, message, type = 'GENERAL') {
    const notifObj = {
      NotificationID: 'NOTIF' + Date.now(),
      UserID: userId,
      Title: title,
      Message: message,
      Type: type,
      ReadStatus: 'Unread',
      CreatedAt: new Date().toISOString()
    };
    Db.insert(CONFIG.SHEETS.NOTIFICATIONS, notifObj);
    return notifObj;
  },

  /**
   * Ensure Notifications sheet includes broadcast scheduling/status columns
   */
  ensureBroadcastSchema() {
    Db.ensureHeaders(CONFIG.SHEETS.NOTIFICATIONS, [
      'NotificationID', 'UserID', 'Title', 'Message', 'Type',
      'ReadStatus', 'CreatedAt', 'StartDate', 'EndDate', 'ExpireAction', 'Status'
    ]);
  },

  /**
   * Get today's date string (yyyy-MM-dd) in app timezone
   */
  getTodayDateStr() {
    return Utilities.formatDate(new Date(), CONFIG.TIMEZONE || 'Asia/Bangkok', 'yyyy-MM-dd');
  },

  /**
   * Normalize date value to yyyy-MM-dd string
   */
  normalizeDateStr(val) {
    if (!val) return '';
    if (val instanceof Date) {
      return Utilities.formatDate(val, CONFIG.TIMEZONE || 'Asia/Bangkok', 'yyyy-MM-dd');
    }
    const str = String(val).trim();
    const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  },

  /**
   * Check if a broadcast announcement is currently active for display
   */
  isBroadcastActive(b, today) {
    if (!b) return false;
    const status = String(b.Status || 'Active').trim();
    if (status === 'Disable') return false;

    const startDate = this.normalizeDateStr(b.StartDate);
    const endDate = this.normalizeDateStr(b.EndDate);
    if (startDate && today < startDate) return false;
    if (endDate && today > endDate) return false;
    return true;
  },

  /**
   * Process expired broadcast announcements (auto-delete or set Status = Disable)
   */
  processExpiredBroadcasts() {
    this.ensureBroadcastSchema();
    const today = this.getTodayDateStr();
    const all = Db.getAll(CONFIG.SHEETS.NOTIFICATIONS) || [];
    const deleteIds = [];
    const disableIds = [];

    all.forEach(n => {
      if (!n || n.UserID !== 'ALL') return;
      const endDate = this.normalizeDateStr(n.EndDate);
      if (!endDate || today <= endDate) return;

      const expireAction = String(n.ExpireAction || 'DISABLE').toUpperCase();
      if (expireAction === 'DELETE') {
        deleteIds.push(String(n.NotificationID));
      } else if (String(n.Status || 'Active') !== 'Disable') {
        disableIds.push(String(n.NotificationID));
      }
    });

    if (deleteIds.length > 0) {
      Db.delete(CONFIG.SHEETS.NOTIFICATIONS, n => deleteIds.includes(String(n.NotificationID)));
    }
    if (disableIds.length > 0) {
      Db.update(CONFIG.SHEETS.NOTIFICATIONS, n => disableIds.includes(String(n.NotificationID)), {
        Status: 'Disable'
      });
    }
  },

  /**
   * Get User Notifications (including active global ALL broadcasts)
   */
  getUserNotifications(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    this.processExpiredBroadcasts();
    const today = this.getTodayDateStr();

    let notifs = Db.find(CONFIG.SHEETS.NOTIFICATIONS, n => {
      if (n.UserID === user.UserID) return true;
      if (n.UserID === 'ALL') return this.isBroadcastActive(n, today);
      return false;
    });
    notifs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    const unreadCount = notifs.filter(n => n.ReadStatus === 'Unread').length;

    return Utils.success({
      notifications: notifs,
      unreadCount: unreadCount
    });
  },

  /**
   * Send Broadcast Notification to all employees - Admin Only
   */
  sendBroadcast(token, broadcastData) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์ส่งประกาศพิเศษ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    if (!broadcastData || !broadcastData.Title || !broadcastData.Message) {
      return Utils.error('กรุณาระบุหัวข้อและข้อความประกาศ');
    }

    this.ensureBroadcastSchema();
    const today = this.getTodayDateStr();
    const startDate = this.normalizeDateStr(broadcastData.StartDate) || today;
    const endDate = this.normalizeDateStr(broadcastData.EndDate);
    const expireAction = String(broadcastData.ExpireAction || 'DISABLE').toUpperCase() === 'DELETE' ? 'DELETE' : 'DISABLE';
    const status = String(broadcastData.Status || 'Active') === 'Disable' ? 'Disable' : 'Active';

    if (endDate && endDate < today) {
      return Utils.error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่ปัจจุบัน');
    }
    if (endDate && startDate && endDate < startDate) {
      return Utils.error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มประกาศ');
    }

    const notifObj = {
      NotificationID: 'NOTIF_BROADCAST_' + Date.now(),
      UserID: 'ALL',
      Title: String(broadcastData.Title).trim(),
      Message: String(broadcastData.Message).trim(),
      Type: broadcastData.Type || 'EMERGENCY', // EPIDEMIC, FLOOD, EARTHQUAKE, SPECIAL_HOLIDAY, EMERGENCY, GENERAL
      ReadStatus: 'Unread',
      StartDate: startDate,
      EndDate: endDate,
      ExpireAction: expireAction,
      Status: status,
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.NOTIFICATIONS, notifObj);
    return Utils.success({ notification: notifObj }, 'ส่งการแจ้งเตือนพิเศษไปยังพนักงานทุกคนเรียบร้อย');
  },

  /**
   * Get Active Broadcast Announcements (and all broadcasts for Admin management)
   */
  getBroadcastAnnouncements(token) {
    this.processExpiredBroadcasts();
    const today = this.getTodayDateStr();
    const all = Db.getAll(CONFIG.SHEETS.NOTIFICATIONS) || [];
    const broadcasts = all.filter(n => n && n.UserID === 'ALL');
    broadcasts.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    const activeAnnouncements = broadcasts.filter(b => this.isBroadcastActive(b, today));
    let isAdmin = false;
    if (token) {
      const valid = Auth.validateSession(token);
      isAdmin = Boolean(valid && valid.success && valid.data && valid.data.user && valid.data.user.Role === CONFIG.ROLES.ADMIN);
    }

    return Utils.success({
      announcements: activeAnnouncements,
      allAnnouncements: isAdmin ? broadcasts : activeAnnouncements
    });
  },

  /**
   * Update Broadcast Status (Active / Disable) - Admin Only
   */
  updateBroadcastStatus(token, notificationId, status, clearExpiredEndDate = false) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์แก้ไขสถานะประกาศ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    this.ensureBroadcastSchema();
    const targetStatus = String(status) === 'Disable' ? 'Disable' : 'Active';
    const existing = Db.findOne(CONFIG.SHEETS.NOTIFICATIONS, n => String(n.NotificationID) === String(notificationId) && n.UserID === 'ALL');
    if (!existing) {
      return Utils.error('ไม่พบประกาศที่ต้องการแก้ไข', 'NOT_FOUND');
    }

    const updateFields = { Status: targetStatus };
    const today = this.getTodayDateStr();
    const endDate = this.normalizeDateStr(existing.EndDate);
    if (targetStatus === 'Active' && endDate && today > endDate) {
      if (!clearExpiredEndDate) {
        return Utils.error('ประกาศนี้เลยวันที่สิ้นสุดแล้ว กรุณาล้างวันที่สิ้นสุดเพื่อเปิดใช้งานต่อ', 'EXPIRED_END_DATE');
      }
      updateFields.EndDate = '';
    }

    Db.update(CONFIG.SHEETS.NOTIFICATIONS, n => String(n.NotificationID) === String(notificationId), updateFields);
    const msg = targetStatus === 'Disable' ? 'ปิดการแจ้งเตือน (Disable) เรียบร้อย' : 'เปิดใช้งานประกาศ (Active) เรียบร้อย';
    return Utils.success({ status: targetStatus }, msg);
  },

  /**
   * Delete Broadcast Announcement - Admin Only
   */
  deleteBroadcast(token, notificationId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== CONFIG.ROLES.ADMIN) {
      return Utils.error('ไม่มีสิทธิ์ลบประกาศ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)', 'FORBIDDEN');
    }

    Db.delete(CONFIG.SHEETS.NOTIFICATIONS, n => String(n.NotificationID) === String(notificationId));
    return Utils.success({}, 'ลบประกาศเรียบร้อย');
  },

  /**
   * Mark notification as read
   */
  markAsRead(token, notificationId) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    Db.update(CONFIG.SHEETS.NOTIFICATIONS, n => n.NotificationID === notificationId, {
      ReadStatus: 'Read'
    });

    return Utils.success({}, 'ทำเครื่องหมายอ่านแล้ว');
  },

  /**
   * Send Email Notification
   */
  sendEmail(toEmail, subject, htmlBody) {
    if (!toEmail) return false;
    try {
      MailApp.sendEmail({
        to: toEmail,
        subject: `[${CONFIG.APP_NAME}] ${subject}`,
        htmlBody: htmlBody
      });
      return true;
    } catch (e) {
      Logger.log('Error sending email: ' + e.toString());
      return false;
    }
  }
};
