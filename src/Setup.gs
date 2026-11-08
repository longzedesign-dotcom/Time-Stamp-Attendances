/**
 * File: Setup.gs
 * Description: Initial database setup, schema verification, and default data seeding.
 */

function setupDatabase() {
  const schemas = {
    [CONFIG.SHEETS.USERS]: [
      'UserID', 'EmployeeCode', 'FullName', 'Email', 'PasswordHash',
      'Position', 'DepartmentID', 'WorkStart', 'WorkEnd', 'Role',
      'Status', 'AvatarUrl', 'CreatedAt', 'UpdatedAt'
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
      'ReadStatus', 'CreatedAt'
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

  // Seed default admin if Users table is empty or missing admin
  const users = Db.getAll(CONFIG.SHEETS.USERS);
  if (users.length === 0) {
    Db.insert(CONFIG.SHEETS.USERS, {
      UserID: 'U0001',
      EmployeeCode: 'E0001',
      FullName: 'คุณ เฉลิมพร ถาโคตร',
      Email: 'thakot.ch@gmail.com',
      PasswordHash: Utils.hashPassword('12345678'),
      Position: 'IT Support',
      DepartmentID: 'IT',
      WorkStart: '08:30',
      WorkEnd: '16:30',
      Role: CONFIG.ROLES.ADMIN,
      Status: 'Active',
      AvatarUrl: '',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    });
  }

  // Seed Default Location if Locations table is empty
  const locations = Db.getAll(CONFIG.SHEETS.LOCATIONS);
  if (locations.length === 0) {
    Db.insert(CONFIG.SHEETS.LOCATIONS, {
      LocationID: CONFIG.DEFAULTS.DEFAULT_LOCATION.ID,
      LocationName: CONFIG.DEFAULTS.DEFAULT_LOCATION.NAME,
      Address: CONFIG.DEFAULTS.DEFAULT_LOCATION.ADDRESS,
      Latitude: CONFIG.DEFAULTS.DEFAULT_LOCATION.LATITUDE,
      Longitude: CONFIG.DEFAULTS.DEFAULT_LOCATION.LONGITUDE,
      RadiusMeter: CONFIG.DEFAULTS.DEFAULT_LOCATION.RADIUS_METERS,
      MinAccuracy: CONFIG.DEFAULTS.DEFAULT_LOCATION.MIN_ACCURACY,
      Status: 'Active'
    });
  }

  // Seed Department if empty
  const depts = Db.getAll(CONFIG.SHEETS.DEPARTMENTS);
  if (depts.length === 0) {
    Db.insert(CONFIG.SHEETS.DEPARTMENTS, {
      DepartmentID: 'IT',
      DepartmentName: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
      ParentDepartmentID: 'OPS',
      Status: 'Active'
    });
  }

  // Seed FAQs if empty
  const faqs = Db.getAll(CONFIG.SHEETS.FAQ_ITEMS);
  if (faqs.length === 0) {
    const defaultFaqs = [
      {
        FAQID: 'FAQ001',
        Category: 'การลงเวลา',
        Question: 'เวลาเข้า-ออกงานมาตรฐานคือเวลาใด?',
        Answer: 'เวลาปฏิบัติงานมาตรฐานคือ 08:30 - 16:30 น. (หากลงเวลาเข้าหลัง 08:30 น. ระบบจะนับเป็นการมาสาย)',
        OrderNum: 1,
        Status: 'Active'
      },
      {
        FAQID: 'FAQ002',
        Category: 'การลงเวลา',
        Question: 'หากลืมลงเวลาเข้างาน หรือออกงาน ต้องทำอย่างไร?',
        Answer: 'สามารถส่งคำขอ "ขอปรับปรุงเวลา (Correction Request)" ผ่านระบบ พร้อมระบุเหตุผล เพื่อส่งให้หัวหน้างานพิจารณาอนุมัติ',
        OrderNum: 2,
        Status: 'Active'
      },
      {
        FAQID: 'FAQ003',
        Category: 'พิกัด GPS',
        Question: 'ระบบแจ้งว่าอยู่นอกพื้นที่ทำงาน (Out of Geofence)?',
        Answer: 'ให้เปิดใช้งาน Location Service บนอุปกรณ์ และอนุญาตให้เว็บบราวเซอร์เข้าถึงพิกัด จากนั้นกดปุ่มเป้าหมายเพื่อตรวจจับพิกัดใหม่อีกครั้ง หรือสลับโหมดเป็น WFH / นอกสถานที่ ตามภารกิจที่ได้รับมอบหมาย',
        OrderNum: 3,
        Status: 'Active'
      }
    ];
    defaultFaqs.forEach(f => Db.insert(CONFIG.SHEETS.FAQ_ITEMS, f));
  }

  return Utils.success({ message: 'ฐานข้อมูลและสคีมาได้รับการตรวจสอบและติดตั้งเรียบร้อยแล้ว' });
}
