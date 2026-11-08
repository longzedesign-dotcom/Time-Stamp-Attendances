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
  let res = null;
  try {
    const data = payload || {};
    const token = data.token;

    switch (action) {
      // Setup & Health
      case 'SETUP_DATABASE':
        res = setupDatabase();
        break;

      // Auth
      case 'LOGIN':
      case 'LOGIN_MEMBER':
        res = Auth.loginMember(data.identifier || data.email, data.password, data.deviceInfo, data.userAgent);
        break;
      case 'LOGIN_LINE':
        res = Auth.loginLINE(data.lineId, data.displayName, data.pictureUrl, data.deviceInfo, data.userAgent);
        break;
      case 'LOGIN_GOOGLE':
        res = Auth.loginGoogle(data.email, data.name, data.pictureUrl, data.deviceInfo, data.userAgent);
        break;
      case 'LOGIN_MOC':
        res = Auth.loginMOC(data.email, data.deviceInfo, data.userAgent);
        break;
      case 'LOGIN_THAID':
        res = Auth.loginThaID(data.idCardNo, data.fullName, data.deviceInfo, data.userAgent);
        break;
      case 'VALIDATE_SESSION':
        res = Auth.validateSession(token);
        break;
      case 'LOGOUT':
        res = Auth.logout(token);
        break;
      case 'UPDATE_PROFILE':
        res = Auth.updateProfile(token, data.profileData);
        break;

      // Attendance
      case 'RECORD_ATTENDANCE':
        res = Attendance.record(token, data);
        break;
      case 'GET_USER_OFFICES':
        res = Attendance.getUserOffices(token);
        break;
      case 'GET_ATTENDANCE_HISTORY':
        res = Attendance.getHistory(token, data.startDate, data.endDate);
        break;
      case 'GET_ATTENDANCE_DETAIL':
        res = Attendance.getDetail(token, data.attendanceId);
        break;
      case 'GET_TODAY_STATUS':
        res = Attendance.getTodayStatus(token);
        break;

      // Workflow
      case 'SUBMIT_CORRECTION':
        res = Workflow.submitCorrection(token, data);
        break;
      case 'SUBMIT_OVERTIME':
        res = Workflow.submitOvertime(token, data);
        break;
      case 'GET_REQUESTS':
        res = Workflow.getRequests(token);
        break;
      case 'REVIEW_REQUEST':
        res = Workflow.reviewRequest(token, data.requestId, data.type, data.status, data.comment);
        break;

      // Chat & Support
      case 'GET_MESSAGES':
        res = Chat.getMessages(token, data.channelId);
        break;
      case 'SEND_MESSAGE':
        res = Chat.sendMessage(token, data.channelId, data.content, data.attachmentUrl);
        break;
      case 'GET_FAQS':
        res = Chat.getFAQs(token);
        break;
      case 'CREATE_HR_TICKET':
        res = Chat.createTicket(token, data);
        break;
      case 'GET_HR_TICKETS':
        res = Chat.getTickets(token);
        break;

      // Notifications
      case 'GET_NOTIFICATIONS':
        res = Notify.getUserNotifications(token);
        break;
      case 'MARK_NOTIFICATION_READ':
        res = Notify.markAsRead(token, data.notificationId);
        break;

      // Reports & Admin
      case 'GET_MONTHLY_SUMMARY':
        res = Reports.getMonthlySummary(token, data.year, data.month);
        break;
      case 'EXPORT_CSV':
        res = Reports.exportCSV(token, data.year, data.month);
        break;
      case 'GET_ADMIN_DASHBOARD':
        res = Admin.getDashboard(token);
        break;
      case 'GET_LOCATIONS':
        res = Admin.getLocations(token);
        break;
      case 'SAVE_LOCATION':
        res = Admin.saveLocation(token, data.locationData);
        break;

      default:
        res = Utils.error(`Unknown API action: "${action}"`);
        break;
    }
  } catch (error) {
    Logger.log(`API Error [${action}]: ` + error.toString());
    res = { success: false, error: { message: error.message || error.toString() } };
  }
  return JSON.stringify(res);
}
