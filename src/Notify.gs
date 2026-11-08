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
   * Get User Notifications
   */
  getUserNotifications(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let notifs = Db.find(CONFIG.SHEETS.NOTIFICATIONS, n => n.UserID === user.UserID);
    notifs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    const unreadCount = notifs.filter(n => n.ReadStatus === 'Unread').length;

    return Utils.success({
      notifications: notifs,
      unreadCount: unreadCount
    });
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
