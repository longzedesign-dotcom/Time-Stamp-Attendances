# Changelog

All notable changes to **Time Stamp Attendances** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
