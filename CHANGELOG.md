# Changelog

All notable changes to **Time Stamp Attendances** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Patch Versioning Standard:** Current baseline is `Time Stamp Attendances : TSA V1.0.40`. Every subsequent patch increments the patch number by `+1` (`V1.0.41`, `V1.0.42`, ...).

## [1.0.40] - 2026-11-18

### Fixed
- **Single-Line Centered Project Name:** Removed horizontal side padding on `projectName` and `contractNo` in `renderMonthlyAttendanceSheet()` (`src/Index.html`) with `white-space: nowrap; text-align: center; font-size: 11px;` and compact left logo (`84px × 38px`) so the project name stays centered on a single line across the full page width.

### Changed
- **Release Sync:** Updated all source headers, `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `TSA V1.0.40` (Deployment `@40`).

## [1.0.39] - 2026-11-18

### Fixed
- **Single-Line Centered Report Title:** Updated `renderMonthlyAttendanceSheet()` in `src/Index.html` so the left logo sits in an absolute slot (`94px`) while `reportTitle` stays centered across the full page width on a single line (`white-space: nowrap; font-size: 12.5px;`), with `projectName` and `contractNo` centered right beneath it.

### Changed
- **Release Sync:** Updated all source headers, `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `TSA V1.0.39` (Deployment `@39`).

## [1.0.38] - 2026-11-18

### Fixed
- **Report Header Center Alignment:** Updated `renderMonthlyAttendanceSheet()` in `src/Index.html` to use a symmetric 3-column grid (`110px 1fr 110px` when logo is present) and full-width `w-[760px]` paper layout so `reportTitle`, `projectName`, and `contractNo` align mathematically centered on the full page/table width.

### Changed
- **Release Sync:** Updated all source headers, `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `TSA V1.0.38` (Deployment `@38`).

## [1.0.37] - 2026-11-18

### Added
- **Monthly Printable Attendance Report & Form Customizer:** Added `รายงานการลงเวลาปฏิบัติงาน` menu item under Settings (after `เชื่อมต่อ Google & LINE Login`) and full A4 portrait printable report modal (`#modal-attendance-report`) in `src/Index.html`.
- **Real Attendance & Holiday Aggregation:** Added `Reports.getMonthlyAttendanceReport()`, `Reports.getReportFormConfig()`, and `Reports.saveReportFormConfig()` in `src/Reports.gs` (wired via `GET_MONTHLY_REPORT`, `GET_REPORT_FORM_CONFIG`, `SAVE_REPORT_FORM_CONFIG` in `src/Code.gs`) using live `Users`, `Attendance`, and `Holiday` sheet data (`วันหยุดประจำสัปดาห์`, `วันหยุดราชการ` + Holiday Name in `หมายเหตุ`).
- **Admin Form Template & Drive Logo Upload:** Added `Files.uploadReportLogo()` and shared `Files.uploadPublicImage()` helper in `src/Files.gs` so Admins can upload a company logo to `Report_Assets` and customize `reportTitle`, `projectName`, `contractNo`, and `signerLabel` stored in `ScriptProperties`.

### Changed
- **Release Sync:** Updated all source headers, `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `TSA V1.0.37` (Deployment `@37`).

## [1.0.36] - 2026-11-16

### Added
- **Apps Script Authorization Helper:** Added `authorizeExternalRequests()` in `src/Code.gs` for one-click `script.external_request` scope authorization inside the Apps Script Editor.
- **Standardized File Headers:** Standardized header docblocks across all 13 `.gs` files and `src/Index.html` under `Project: Time Stamp Attendances : TSA V1.0.36`.

### Fixed
- **LINE Login OAuth2 Scope & Token Exchange:** Updated LINE Login scope in `src/Auth.gs` (`createOAuthAuthUrl`) from `profile openid email` to `profile openid` so standard channels without LINE Email Permission work cleanly, and added explicit `contentType: 'application/x-www-form-urlencoded'` for LINE token & verify calls.

### Changed
- **Release Sync:** Updated `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `TSA V1.0.36` (Deployment `@35`).

## [1.0.35] - 2026-11-11

### Added
- **Real Google OAuth 2.0 & LINE Login v2.1:** Implemented Authorization Code Flow via `doGet(e)` (`Auth.createOAuthAuthUrl()`, `Auth.handleOAuthCallback()`, `Auth.completeOAuthLogin()`) with `CacheService` single-use CSRF `state` and `PropertiesService` secret storage.
- **1-Time Employee Account Linking:** Added `Auth.linkOAuthAccount()` and `promptLinkOAuthAccount()` modal in `src/Index.html` for first-time LINE/Google sign-ins not yet bound to `Users` (`LineUserID`, `GoogleSub` added to `src/Setup.gs`).
- **Admin OAuth Settings UI:** Added Admin-only `#modal-oauth-settings` (`GET_OAUTH_SETTINGS`, `SAVE_OAUTH_SETTINGS`) showing copyable Callback URL and masked secret inputs.
- **Manifest Scope:** Added `https://www.googleapis.com/auth/script.external_request` to `src/appsscript.json`.

### Changed
- **Security Hardening:** Removed mock fallback login from `Auth.loginLINE()` and `Auth.loginGoogle()` and refactored credential checks into `Auth.verifyEmployeeCredentials()`.

## [1.0.34] - 2026-11-11

### Added
- **Mobile Profile Photo Upload & Camera Capture:** Updated `promptAvatarUpload()` in `src/Index.html` with mobile camera capture (`capture="user"`), photo library picker, square center-crop & compression (`compressAvatarImage`), live preview confirmation, and avatar removal (`removeUserAvatar`).
- **Google Drive Avatar Storage:** Added `Files.getOrCreateSubfolder()` and `Files.uploadAvatar()` in `src/Files.gs` storing profile photos in `Profile_Avatars` with `lh3.googleusercontent.com` direct image URLs and resilient thumbnail/Data-URL fallbacks (`renderUserAvatars`, `handleAvatarImgError`).

### Changed
- **Profile Update & Session Sync:** Updated `Auth.updateProfile()` and `Auth.createSession()` in `src/Auth.gs` to handle `avatarBase64` uploads, ensure `Users` sheet headers, clear session cache on update, and include `AvatarUrl` in login responses.
- **Release Sync:** Updated `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `V1.0.34`.

## [1.0.33] - 2026-11-11

### Performance
- **Instant Optimistic Chat Send:** Updated `sendChatMessage()` in `src/Index.html` to render sent bubbles immediately (`0ms` perceived latency) with `Enter`-to-send, retry on failure, and in-place confirmation without triggering a redundant `GET_MESSAGES` round-trip.
- **Server-Side Cache & Delta Sync:** Added 60s `CacheService` session caching in `src/Auth.gs` (`validateSession`, invalidated on `logout` / `updateProfile`) and 300s channel message caching + `afterMessageId` incremental delta sync in `src/Chat.gs` & `src/Code.gs`, returning `{ unchanged: true }` with zero Sheet reads when no new messages exist.

### Added
- **Smart 5-Second Chat Polling:** Added `startChatPolling()` / `stopChatPolling()` in `src/Index.html` (auto-refreshes every 5s only while the chat modal is open and the tab is visible, with in-flight guard, smart scroll preservation, manual refresh button, and `escapeChatHtml()` XSS escaping).

### Changed
- **Release Sync:** Updated `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `V1.0.33`.

## [1.0.32] - 2026-11-11

### Fixed
- **Calendar Default Month (Thailand Time):** Removed hardcoded July 2026 calendar defaults (`2026`, month `6`, `2026-07-13`) and added `getThailandDateParts()` / `resetCalendarToThailandToday()` in `src/Index.html` using `Asia/Bangkok` (`UTC+7`) so the Calendar tab always loads on the current Thailand month and today's date across `DOMContentLoaded`, `loadDashboardData()`, and `switchTab('calendar')`.

### Changed
- **Timezone-Safe Calendar Grid & Today Highlight:** Updated `renderCalendar()` in `src/Index.html` to use `Date.UTC` day calculations and highlight today's Thailand date cell.
- **Release Sync:** Updated `src/Config.gs`, `src/Index.html`, `README.md`, `INSTALL_GUIDE.md`, and `CHANGELOG.md` to `V1.0.32`.

## [1.0.31] - 2026-11-11

### Added
- **Scheduled Broadcast Start/End Dates:** Added `StartDate` and `EndDate` fields to the Special Broadcast creation modal in `src/Index.html` with `Asia/Bangkok` date bounds validation.
- **Auto-Expire Broadcast Actions:** Added `ExpireAction` (`DISABLE` or `DELETE`) so expired announcements automatically switch to `Status: 'Disable'` or delete themselves via `Notify.processExpiredBroadcasts()` in `src/Notify.gs`.
- **Manual Enable/Disable Toggle:** Added `UPDATE_BROADCAST_STATUS` API route in `src/Code.gs` and `Notify.updateBroadcastStatus()` in `src/Notify.gs`, plus `Disable` / `เปิด` toggle button in the Admin broadcast list.
- **Automatic Sheet Header Migration:** Added `Db.ensureHeaders()` in `src/Db.gs` and updated `Notifications` schema in `src/Setup.gs` (`StartDate`, `EndDate`, `ExpireAction`, `Status`).
- **Release Changelog:** Added `CHANGELOG.md` and standardized patch release workflow.

### Changed
- **Settings Menu Icon Colors:** Updated `src/Index.html` settings menu icons to orange (`text-orange-500`) for การแจ้งเตือน, green (`text-emerald-600`) for สถานที่ทำงาน, and purple (`text-purple-600`) for ตั้งค่าวันหยุด.
- **Documentation Sync:** Updated `src/Config.gs`, `src/Index.html`, `README.md`, and `INSTALL_GUIDE.md` to `V1.0.31`.

## [1.0.30] - 2026-11-09

### Added
- Bulk Thai public holiday preset (1-click import) and CSV holiday import.
- Special Broadcast Alerts (Epidemic, Flood, Earthquake, Special Holiday, Emergency, General) on main dashboard.
- Updated `README.md` and `INSTALL_GUIDE.md` for V1.0.30.

## [1.0.29] - 2026-11-09

### Added
- Holiday Settings modal & Admin API (`GET_HOLIDAYS`, `SAVE_HOLIDAY`, `DELETE_HOLIDAY`).

### Changed
- Renamed workplace settings menu label to `สถานที่ทำงาน` and updated notification icon styling.

## [1.0.28] - 2026-11-08

### Added
- Green geofence radius circle on Leaflet map and GPS verification by selected workplace location.
