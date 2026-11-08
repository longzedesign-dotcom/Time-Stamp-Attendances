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
   * Get User Notifications (including global ALL broadcasts)
   */
  getUserNotifications(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let notifs = Db.find(CONFIG.SHEETS.NOTIFICATIONS, n => n.UserID === user.UserID || n.UserID === 'ALL');
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

    const notifObj = {
      NotificationID: 'NOTIF_BROADCAST_' + Date.now(),
      UserID: 'ALL',
      Title: String(broadcastData.Title).trim(),
      Message: String(broadcastData.Message).trim(),
      Type: broadcastData.Type || 'EMERGENCY', // EPIDEMIC, FLOOD, EARTHQUAKE, SPECIAL_HOLIDAY, EMERGENCY, GENERAL
      ReadStatus: 'Unread',
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.NOTIFICATIONS, notifObj);
    return Utils.success({ notification: notifObj }, 'ส่งการแจ้งเตือนพิเศษไปยังพนักงานทุกคนเรียบร้อย');
  },

  /**
   * Get Active Broadcast Announcements
   */
  getBroadcastAnnouncements(token) {
    const all = Db.getAll(CONFIG.SHEETS.NOTIFICATIONS) || [];
    const broadcasts = all.filter(n => n && n.UserID === 'ALL');
    broadcasts.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    return Utils.success({ announcements: broadcasts });
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
