/**
 * Project: Time Stamp Attendances (OPS MOC Edition)
 * Version: 2.0.8
 * Description: Enterprise Time & Attendance Tracking with Geofencing, Full-screen Map, Chat, Q&A & Workflow
 */

const CONFIG = Object.freeze({
  APP_NAME: 'Time Stamp Attendance',
  APP_ORGANIZATION: 'สำนักงานปลัดกระทรวงพาณิชย์',
  APP_ORGANIZATION_EN: 'Office of the Permanent Secretary, Ministry of Commerce',
  APP_VERSION: '2.0.8',
  TIMEZONE: 'Asia/Bangkok',

  // Google Drive & Spreadsheet Target IDs
  SPREADSHEET_ID: '1KnDb_Pl9cYDhFXjBM-Moe9A3xE-vXDSz2cLMYsfHbQo',
  DRIVE_FOLDER_ID: '1MAGUA7IaoQ-IVbp6IJ7yJIZSGxMXvyrI',
  SELFIES_FOLDER_NAME: 'Attendance_Selfies',

  SHEETS: Object.freeze({
    USERS: 'Users',
    ATTENDANCE: 'Attendance',
    LOCATIONS: 'Locations',
    SESSIONS: 'Sessions',
    NOTIFICATIONS: 'Notifications',
    DEPARTMENTS: 'Departments',
    SETTINGS: 'Settings',
    AUDIT_LOGS: 'Auditlogs',
    HOLIDAY: 'Holiday',
    CORRECTIONS: 'CorrectionRequests',
    OVERTIME: 'OvertimeRequests',
    CHAT_MESSAGES: 'ChatMessages',
    FAQ_ITEMS: 'FAQItems',
    HR_TICKETS: 'HRTickets'
  }),

  ROLES: Object.freeze({
    ADMIN: 'Admin',
    SUPERVISOR: 'Supervisor',
    USER: 'User'
  }),

  ATTENDANCE_TYPE: Object.freeze({
    CHECK_IN: 'CHECK_IN',
    CHECK_OUT: 'CHECK_OUT'
  }),

  ATTENDANCE_STATUS: Object.freeze({
    ON_TIME: 'ON_TIME',
    LATE: 'LATE',
    EARLY_LEAVE: 'EARLY_LEAVE',
    CHECKED_OUT: 'CHECKED_OUT'
  }),

  WORK_MODES: Object.freeze({
    ONSITE: 'ONSITE',
    WFH: 'WFH',
    OFFSITE: 'OFFSITE'
  }),

  SECURITY: Object.freeze({
    SESSION_HOURS: 24,
    SALT: 'TSA_MOC_SECURE_SALT_v208'
  }),

  DEFAULTS: Object.freeze({
    WORK_START: '08:30',
    WORK_END: '16:30',
    LATE_GRACE_MINUTES: 0,
    DEFAULT_LOCATION: Object.freeze({
      ID: 'LOC001',
      NAME: 'สำนักงานหลัก',
      ADDRESS: '567 ถนนนนทบุรี ตำบลบางกระสอ อำเภอเมือง จังหวัดนนทบุรี 11000',
      LATITUDE: 13.91094031,
      LONGITUDE: 100.5946153,
      RADIUS_METERS: 200,
      MIN_ACCURACY: 100
    })
  })
});
