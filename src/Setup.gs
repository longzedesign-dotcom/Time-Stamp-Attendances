/**
 * ==============================================================================
 * Project       : Time Stamp Attendances (TSA Enterprise Edition)
 * Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
 * Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
 * File          : Setup.gs
 * Module/Layer  : Database Migration / Schema Definition & Self-Healing Seeder
 * Description   : สร้างโครงสร้างตารางเริ่มต้น 14 ตารางบน Google Sheets และตรวจสอบความสมบูรณ์ของ Schema
 * Version       : 1.0.47
 * Author        : TSA Engineering Team
 * Created Date  : 2026-11-08
 * Last Modified : 2026-11-18
 * License       : Proprietary / Enterprise Internal Use
 * Copyright (c) : 2026 Time Stamp Attendances. All rights reserved.
 * ------------------------------------------------------------------------------
 * Revision History:
 * - V1.0.46 (2026-11-18) : Updated source code header to Corporate Enterprise Standard
 * - V1.0.47 (2026-11-18) : Aligned version header with TSA V1.0.47 release
 * ==============================================================================
 */

function setupDatabase() {
  const schemas = {
    [CONFIG.SHEETS.USERS]: [
      'UserID', 'EmployeeCode', 'FullName', 'Email', 'PasswordHash',
      'Position', 'DepartmentID', 'WorkStart', 'WorkEnd', 'Role',
      'Status', 'AvatarUrl', 'CreatedAt', 'UpdatedAt', 'LineUserID', 'GoogleSub'
    ],
    [CONFIG.SHEETS.ATTENDANCE]: [
      'AttendanceID', 'UserID', 'EmployeeCode', 'FullName', 'WorkDate',
      'WorkTime', 'Type', 'Status', 'Latitude', 'Longitude',
      'Accuracy', 'DistanceMeter', 'LocationID', 'LocationName', 'Address',
      'DeviceInfo', 'UserAgent', 'SelfieUrl', 'WorkMode', 'CreatedAt', 'Remark'
    ],
    [CONFIG.SHEETS.LOCATIONS]: [
      'LocationID', 'LocationName', 'Address', 'Latitude', 'Longitude',
      'RadiusMeter', 'MinAccuracy', 'Status'
    ],
    [CONFIG.SHEETS.SESSIONS]: [
      'SessionID', 'UserID', 'Token', 'LoginAt', 'ExpireAt',
      'DeviceInfo', 'UserAgent', 'Status'
    ],
    [CONFIG.SHEETS.NOTIFICATIONS]: [
      'NotificationID', 'UserID', 'Title', 'Message', 'Type',
      'ReadStatus', 'CreatedAt', 'StartDate', 'EndDate', 'ExpireAction', 'Status'
    ],
    [CONFIG.SHEETS.DEPARTMENTS]: [
      'DepartmentID', 'DepartmentName', 'ParentDepartmentID', 'Status'
    ],
    [CONFIG.SHEETS.SETTINGS]: [
      'Key', 'Value', 'Description'
    ],
    [CONFIG.SHEETS.AUDIT_LOGS]: [
      'LogID', 'UserID', 'Action', 'Detail', 'IPAddress', 'UserAgent', 'CreatedAt'
    ],
    [CONFIG.SHEETS.HOLIDAY]: [
      'HolidayDate', 'HolidayName', 'Type', 'Status'
    ],
    [CONFIG.SHEETS.CORRECTIONS]: [
      'RequestID', 'UserID', 'EmployeeCode', 'FullName', 'TargetDate',
      'CorrectTime', 'Type', 'Reason', 'Status', 'ApproverID', 'ApproverComment', 'CreatedAt'
    ],
    [CONFIG.SHEETS.OVERTIME]: [
      'RequestID', 'UserID', 'EmployeeCode', 'FullName', 'OTDate',
      'StartTime', 'EndTime', 'TotalHours', 'Reason', 'Status', 'ApproverID', 'ApproverComment', 'CreatedAt'
    ],
    [CONFIG.SHEETS.CHAT_MESSAGES]: [
      'MessageID', 'ChannelID', 'SenderID', 'SenderName', 'Content',
      'AttachmentUrl', 'CreatedAt'
    ],
    [CONFIG.SHEETS.FAQ_ITEMS]: [
      'FAQID', 'Category', 'Question', 'Answer', 'OrderNum', 'Status'
    ],
    [CONFIG.SHEETS.HR_TICKETS]: [
      'TicketID', 'UserID', 'FullName', 'Category', 'Subject',
      'Details', 'Status', 'Response', 'ResolvedAt', 'CreatedAt'
    ]
  };

  const ss = Db.getSpreadsheet();

  // Create or verify each sheet
  Object.keys(schemas).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Db.setHeaders(sheetName, schemas[sheetName]);
    } else {
      const existingHeaders = Db.getHeaders(sheetName);
      if (existingHeaders.length === 0) {
        Db.setHeaders(sheetName, schemas[sheetName]);
      }
    }
  });

  // Ensure default Locations (Dual Office: Main & Site)
  const locMain = Db.findOne(CONFIG.SHEETS.LOCATIONS, l => l.LocationID === 'LOC001');
  if (!locMain) {
    Db.insert(CONFIG.SHEETS.LOCATIONS, {
      LocationID: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.ID,
      LocationName: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.NAME,
      Address: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.ADDRESS,
      Latitude: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.LATITUDE,
      Longitude: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.LONGITUDE,
      RadiusMeter: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.RADIUS_METERS,
      MinAccuracy: CONFIG.LOCATIONS_DEFAULT.MAIN_OFFICE.MIN_ACCURACY,
      Status: 'Active'
    });
  }

  const locSite = Db.findOne(CONFIG.SHEETS.LOCATIONS, l => l.LocationID === 'LOC002');
  if (!locSite) {
    Db.insert(CONFIG.SHEETS.LOCATIONS, {
      LocationID: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.ID,
      LocationName: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.NAME,
      Address: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.ADDRESS,
      Latitude: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.LATITUDE,
      Longitude: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.LONGITUDE,
      RadiusMeter: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.RADIUS_METERS,
      MinAccuracy: CONFIG.LOCATIONS_DEFAULT.SITE_OFFICE.MIN_ACCURACY,
      Status: 'Active'
    });
  }

  return Utils.success({ message: 'ฐานข้อมูลได้รับการตรวจสอบและตั้งค่าเรียบร้อยแล้ว' });
}
