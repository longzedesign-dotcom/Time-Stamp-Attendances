/**
 * Project: ระบบลงเวลาเข้างานออนไลน์ประจำหน่วยงาน (Time Stamp Attendances)
 * File: Code.gs
 * Description: Web App Entry Point and Client-Server API Dispatcher.
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.APP_NAME + ' - ' + CONFIG.APP_ORGANIZATION)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Universal Client-Server API Dispatcher
 */
function apiDispatcher(action, payload) {
  try {
    const data = payload || {};
    const token = data.token;

    switch (action) {
      // Setup & Health
      case 'SETUP_DATABASE':
        return setupDatabase();

      // Auth
      case 'LOGIN':
      case 'LOGIN_MEMBER':
        return Auth.loginMember(data.identifier || data.email, data.password, data.deviceInfo, data.userAgent);
      case 'LOGIN_LINE':
        return Auth.loginLINE(data.lineId, data.displayName, data.pictureUrl, data.deviceInfo, data.userAgent);
      case 'LOGIN_GOOGLE':
        return Auth.loginGoogle(data.email, data.name, data.pictureUrl, data.deviceInfo, data.userAgent);
      case 'LOGIN_MOC':
        return Auth.loginMOC(data.email, data.deviceInfo, data.userAgent);
      case 'LOGIN_THAID':
        return Auth.loginThaID(data.idCardNo, data.fullName, data.deviceInfo, data.userAgent);
      case 'VALIDATE_SESSION':
        return Auth.validateSession(token);
      case 'LOGOUT':
        return Auth.logout(token);
      case 'UPDATE_PROFILE':
        return Auth.updateProfile(token, data.profileData);

      // Attendance
      case 'RECORD_ATTENDANCE':
        return Attendance.record(token, data);
      case 'GET_USER_OFFICES':
        return Attendance.getUserOffices(token);
      case 'GET_ATTENDANCE_HISTORY':
        return Attendance.getHistory(token, data.startDate, data.endDate);
      case 'GET_ATTENDANCE_DETAIL':
        return Attendance.getDetail(token, data.attendanceId);
      case 'GET_TODAY_STATUS':
        return Attendance.getTodayStatus(token);

      // Workflow
      case 'SUBMIT_CORRECTION':
        return Workflow.submitCorrection(token, data);
      case 'SUBMIT_OVERTIME':
        return Workflow.submitOvertime(token, data);
      case 'GET_REQUESTS':
        return Workflow.getRequests(token);
      case 'REVIEW_REQUEST':
        return Workflow.reviewRequest(token, data.requestId, data.type, data.status, data.comment);

      // Chat & Support
      case 'GET_MESSAGES':
        return Chat.getMessages(token, data.channelId);
      case 'SEND_MESSAGE':
        return Chat.sendMessage(token, data.channelId, data.content, data.attachmentUrl);
      case 'GET_FAQS':
        return Chat.getFAQs(token);
      case 'CREATE_HR_TICKET':
        return Chat.createTicket(token, data);
      case 'GET_HR_TICKETS':
        return Chat.getTickets(token);

      // Notifications
      case 'GET_NOTIFICATIONS':
        return Notify.getUserNotifications(token);
      case 'MARK_NOTIFICATION_READ':
        return Notify.markAsRead(token, data.notificationId);

      // Reports & Admin
      case 'GET_MONTHLY_SUMMARY':
        return Reports.getMonthlySummary(token, data.year, data.month);
      case 'EXPORT_CSV':
        return Reports.exportCSV(token, data.year, data.month);
      case 'GET_ADMIN_DASHBOARD':
        return Admin.getDashboard(token);
      case 'GET_LOCATIONS':
        return Admin.getLocations(token);
      case 'SAVE_LOCATION':
        return Admin.saveLocation(token, data.locationData);

      default:
        return Utils.error(`Unknown API action: "${action}"`);
    }
  } catch (error) {
    Logger.log(`API Error [${action}]: ` + error.toString());
    return Utils.error(error.message || 'เกิดข้อผิดพลาดในการประมวลผลระบบ');
  }
}
