/**
 * ==============================================================================
 * Project       : Time Stamp Attendances (TSA Enterprise Edition)
 * Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
 * Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
 * File          : Config.gs
 * Module/Layer  : Configuration / Enterprise Constants & Environment Settings
 * Description   : ศูนย์รวมค่าคงที่ของระบบ, ขอบเขตเวลา, รหัส Spreadsheet, โฟลเดอร์ Drive และเวอร์ชันแอปพลิเคชัน
 * Version       : 1.0.48
 * Author        : TSA Engineering Team
 * Created Date  : 2026-11-08
 * Last Modified : 2026-11-18
 * License       : Proprietary / Enterprise Internal Use
 * Copyright (c) : 2026 Time Stamp Attendances. All rights reserved.
 * ------------------------------------------------------------------------------
 * Revision History:
 * - V1.0.46 (2026-11-18) : Updated source code header to Corporate Enterprise Standard
 * - V1.0.47 (2026-11-18) : Bump version to 1.0.47 for Profile Edit & Password Change feature
 * - V1.0.48 (2026-11-18) : Adjusted project name font size to 10px on Monthly Report
 * ==============================================================================
 */

const CONFIG = Object.freeze({
  APP_NAME: 'Time Stamp Attendances',
  APP_ORGANIZATION: 'ระบบลงเวลาเข้างานออนไลน์',
  APP_ORGANIZATION_EN: 'Time Stamp Attendances',
  APP_VERSION: '1.0.48',
  APP_UPDATED_AT: '2026-11-18',
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

  // Enterprise Security & Brute-force Lockout
  SECURITY: Object.freeze({
    SESSION_HOURS: 24,
    SALT: 'TSA_MOC_SECURE_SALT_v210',
    LOGIN_MAX_FAILED_ATTEMPTS: 10,
    LOGIN_FAILURE_WINDOW_SECONDS: 300,
    LOGIN_LOCKOUT_SECONDS: 300
  }),

  // Enterprise GPS Filtering & Anti-Spoofing Parameters
  GPS: Object.freeze({
    MAX_ACCURACY_METERS: 150,
    TARGET_ACCURACY_METERS: 50,
    WATCH_TIMEOUT_MS: 45000,
    MIN_COLLECTION_MS: 8000,
    MIN_STABLE_SAMPLES: 3,
    MAX_SAMPLE_WINDOW: 20,
    STABILITY_RADIUS_METERS: 100,
    GEOFENCE_ENFORCED: true,
    GEOFENCE_ACCURACY_BUFFER_MAX_METERS: 25,
    GEOFENCE_ACCURACY_BUFFER_FACTOR: 0.25,
    DEFAULT_LOCATION_RADIUS_METERS: 300
  }),

  // Official Attendance Time Windows
  TIME_WINDOWS: Object.freeze({
    CHECK_IN_START: '06:00',
    NORMAL_UNTIL: '08:30',
    LATE_START: '08:31',
    CHECK_IN_END: '12:00',
    CHECK_OUT_START: '13:30',
    CHECK_OUT_END: '20:00',
    DUPLICATE_WINDOW_SECONDS: 60
  }),

  // Dual Office Locations
  LOCATIONS_DEFAULT: Object.freeze({
    MAIN_OFFICE: Object.freeze({
      ID: 'LOC001',
      NAME: 'สำนักงานใหญ่ (Main Office)',
      ADDRESS: '567 ถนนนนทบุรี ตำบลบางกระสอ อำเภอเมือง จังหวัดนนทบุรี 11000',
      LATITUDE: 13.91094031,
      LONGITUDE: 100.5946153,
      RADIUS_METERS: 300,
      MIN_ACCURACY: 100
    }),
    SITE_OFFICE: Object.freeze({
      ID: 'LOC002',
      NAME: 'สำนักงานประจำ (Site Office)',
      ADDRESS: '563 ถนนนนทบุรี ตำบลบางกระสอ อำเภอเมือง จังหวัดนนทบุรี 11000',
      LATITUDE: 13.9105000,
      LONGITUDE: 100.5942000,
      RADIUS_METERS: 300,
      MIN_ACCURACY: 100
    })
  })
});
