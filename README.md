# 🏢 ระบบลงเวลาเข้างานออนไลน์ประจำหน่วยงาน (Time Stamp Attendances)

<div align="center">

# ระบบลงเวลาเข้างานออนไลน์อัจฉริยะ (Enterprise Edition)
### Next-Gen GPS Geofencing, Full-Screen Map, Thai Buddhist Calendar, Real-time Broadcast & Admin Suite

[![Version](https://img.shields.io/badge/Version-1.0.32%20(Build%2029)-blue?style=flat-square)](https://github.com/longzedesign-dotcom/Time-Stamp-Attendances)
[![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script%20%7C%20Web%20App-34A853?style=flat-square&logo=google)](https://script.google.com/)
[![Database](https://img.shields.io/badge/Database-Google%20Sheets%20(14%20Tables)-0F9D58?style=flat-square&logo=googlesheets)](https://www.google.com/sheets/about/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**🌐 URL ใช้งานระบบจริง (Web App Production URL):**  
[https://script.google.com/macros/s/AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q/exec](https://script.google.com/macros/s/AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q/exec)

</div>

---

## 📖 สารบัญ
1. [ภาพรวมของระบบ (Overview)](#-ภาพรวมของระบบ-overview)
2. [ฟังก์ชันการทำงานหลัก (Key Features)](#-ฟังก์ชันการทำงานหลัก-key-features)
   - [1. หน้าจอหลักและระบบลงเวลาด้วย GPS (Smart Clock Hub)](#1-หน้าจอหลักและระบบลงเวลาด้วย-gps-smart-clock-hub)
   - [2. ระบบจัดการสถานที่ทำงานและสาขา (Workplaces & Sites Management)](#2-ระบบจัดการสถานที่ทำงานและสาขา-workplaces--sites-management)
   - [3. ระบบจัดการวันหยุดและนำเข้าข้อมูลทั้งปี (Holiday Settings & 1-Click Preset)](#3-ระบบจัดการวันหยุดและนำเข้าข้อมูลทั้งปี-holiday-settings--1-click-preset)
   - [4. ระบบประกาศแจ้งเตือนพิเศษฉุกเฉิน (Special Broadcast Announcements)](#4-ระบบประกาศแจ้งเตือนพิเศษฉุกเฉิน-special-broadcast-announcements)
   - [5. ปฏิทิน พ.ศ. และประวัติการลงเวลา (Calendar & History View)](#5-ปฏิทิน-พศ-และประวัติการลงเวลา-calendar--history-view)
   - [6. ระบบยืนยันตัวตนและความปลอดภัย (Authentication & Security)](#6-ระบบยืนยันตัวตนและความปลอดภัย-authentication--security)
   - [7. ระบบสายอนุมัติคำขอ (Workflow & Approvals)](#7-ระบบสายอนุมัติคำขอ-workflow--approvals)
   - [8. ระบบสื่อสารและศูนย์ช่วยเหลือ (Chat & Support Tickets)](#8-ระบบสื่อสารและศูนย์ช่วยเหลือ-chat--support-tickets)
   - [9. การรายงานและส่งออกข้อมูล (Reports & Export)](#9-การรายงานและส่งออกข้อมูล-reports--export)
3. [โครงสร้างฐานข้อมูล Google Sheets (14 ตาราง)](#️-โครงสร้างฐานข้อมูล-google-sheets-14-ตาราง)
4. [โครงสร้างไฟล์โค้ดของระบบ (Codebase Architecture)](#-โครงสร้างไฟล์โค้ดของระบบ-codebase-architecture)
5. [คู่มือการติดตั้งและตั้งค่าระบบ (Installation Guide)](#️-คู่มือการติดตั้งและตั้งค่าระบบ-installation-guide)
6. [บัญชีผู้ใช้เริ่มต้นสำหรับการทดสอบ (Default Accounts)](#-บัญชีผู้ใช้เริ่มต้นสำหรับการทดสอบ-default-accounts)

---

## 🌟 ภาพรวมของระบบ (Overview)

**ระบบลงเวลาเข้างานออนไลน์ประจำหน่วยงาน (Time Stamp Attendances)** พัฒนาขึ้นด้วยสถาปัตยกรรม Google Apps Script (GAS) ไร้เซิร์ฟเวอร์ (Serverless) เชื่อมต่อกับฐานข้อมูล Google Sheets โดยตรง รองรับการใช้งานผ่าน Web Browser ทั้งบนสมาร์ตโฟน (iOS / Android) แท็บเล็ต และคอมพิวเตอร์ โดยไม่ต้องติดตั้งโปรแกรมเพิ่มเติม

ระบบถูกออกแบบมาเพื่อรองรับองค์กรที่มีทั้ง **สำนักงานใหญ่**, **สำนักงานสาขา**, และ **ไซต์งานปฏิบัติการหลายแห่ง** พร้อมระบบ Geofence ตรวจสอบพิกัด GPS อัตโนมัติ ป้องกันการปลอมแปลงพิกัด และมีระบบสื่อสารฉุกเฉินแบบเรียลไทม์

---

## 🚀 ฟังก์ชันการทำงานหลัก (Key Features)

### 1. หน้าจอหลักและระบบลงเวลาด้วย GPS (Smart Clock Hub)
- **แผนที่พิกัดจริงแบบเต็มจอ (Full-screen Leaflet Map):** แสดงตำแหน่งผู้ใช้แบบ Real-time พร้อมจุดกระพริบ Pulse แสดงรัศมีความแม่นยำ
- **รัศมี Geofence วงกลมสีเขียว (Green Geofence Circle):** กางรัศมีพื้นที่ลงเวลาเป็นวงกลมสีเขียวมรกต (`#10b981`) เหนือแผนที่เมื่อเลือกโหมดสำนักงาน
- **ระบบเลือกสำนักงาน/ไซต์งาน:** สามารถเลือกสถานที่ลงเวลาได้จาก Dropdown หรือกดปุ่มเล็งพิกัด (Crosshairs) เพื่อตรวจสอบระยะห่างจริงแบบอัตโนมัติ
- **โหมดการปฏิบัติงาน (Work Modes):**
  - 🏢 **ประจำสำนักงาน (Onsite):** ตรวจสอบพิกัดให้อยู่ในรัศมีที่กำหนด
  - 🏠 **ปฏิบัติงานที่บ้าน (WFH):** สำหรับการทำงานแบบ Remote Work
  - 🚗 **ปฏิบัติงานนอกสถานที่ (Field Visit):** สำหรับเจ้าหน้าที่ออกตรวจงานภายนอก
- **ปุ่มคู่ลงเวลาขนาดใหญ่:** `[ 🟢 ลงเวลาเข้า ]` และ `[ 🔴 ลงเวลาออก ]` ชัดเจน พร้อมระบบป้องกันการกดซ้ำซ้อนภายใน 60 วินาที
- **การ์ดวันเวลาแบบ Floating:** แสดง วัน เดือน ปี พ.ศ. พร้อมเวลานาฬิกาดิจิทัลแบบเดินต่อเนื่อง

### 2. ระบบจัดการสถานที่ทำงานและสาขา (Workplaces & Sites Management)
*(เฉพาะผู้ดูแลระบบ Admin)*
- เพิ่ม/แก้ไข/ลบ สำนักงานหลัก และ Site งานย่อยได้ไม่จำกัด
- **ปุ่มดึงพิกัดปัจจุบันอัตโนมัติ (Fill Current GPS):** กดขณะยืนอยู่ที่ไซต์งานจริงเพื่ออ่านค่า Latitude/Longitude จากอุปกรณ์ทันที
- ปรับระยะรัศมีลงเวลา (Geofence Radius) ได้ตั้งแต่ 100 เมตร จนถึง 1,000 เมตร
- **ปุ่มสลับสถานะเปิด/ปิดการใช้งานแบบ Toggle Switch (iOS Style):** สลับสถานะเปิด/ปิดใช้งาน พร้อมกล่องข้อความ SweetAlert ยืนยันความปลอดภัย
- แสดงระยะห่างระหว่างตำแหน่งปัจจุบันกับสถานที่แต่ละแห่งแบบ Realtime

### 3. ระบบจัดการวันหยุดและนำเข้าข้อมูลทั้งปี (Holiday Settings & 1-Click Preset)
*(เฉพาะผู้ดูแลระบบ Admin)*
- เมนู **"ตั้งค่าวันหยุด"** (ไอคอน Alarm สีแดง `fa-stopwatch`)
- **ระบบนำเข้าข้อมูลวันหยุดทั้งปีในคลิกเดียว (1-Click Auto Preset):**
  - รองรับวันหยุดราชการไทยประจำปี **2569 (2026)**, **2570 (2027)**, และ **2568 (2025)** ครบถ้วนตามประกาศทางการ
  - กดปุ่ม **"นำเข้าวันหยุดทั้งปีทันที"** ระบบจะเพิ่มข้อมูลทั้งปีอัตโนมัติ ไม่ต้องกรอกทีละวัน
- **ระบบนำเข้าจากข้อความ/ไฟล์ CSV (Bulk Import):** วางข้อมูลหลายบรรทัดในรูปแบบ `YYYY-MM-DD, ชื่อวันหยุด, ประเภท` เพื่อนำเข้าวันหยุดเฉพาะของบริษัท
- ฟอร์มเพิ่ม/แก้ไขวันหยุด พร้อมสลับสถานะเปิด/ปิดการใช้งานด้วย Toggle Switch

### 4. ระบบประกาศแจ้งเตือนพิเศษฉุกเฉิน (Special Broadcast Announcements)
*(เฉพาะผู้ดูแลระบบ Admin)*
- ระบบส่งประกาศด่วนไปยังหน้าหลักของ **พนักงานทุกคนพร้อมกันแบบ Real-time**:
  - 🦠 **โรคระบาด** (Epidemic / มาตรการด้านสุขอนามัย)
  - 🌊 **น้ำท่วม** (Flood Alert / อุทกภัย)
  - 🏢 **แผ่นดินไหว** (Earthquake / ภัยธรรมชาติ)
  - ⭐ **วันหยุดพิเศษที่บริษัทกำหนด** (Special Holiday)
  - 🚨 **เหตุฉุกเฉิน / ภัยพิบัติเร่งด่วน** (Emergency Alert)
  - 📢 **ประกาศสำคัญทั่วไป** (General Urgent Notice)
- **แถบประกาศฉุกเฉินบนหน้าหลัก (Dashboard Banner):** แสดงผลแบบ Gradient สีสันตามหมวดหมู่ พร้อมจุดไฟกระพริบ `animate-pulse` และปุ่มกดเปิดอ่านประกาศฉบับเต็ม
- **ตั้งเวลาแสดงผลและปิด/ลบอัตโนมัติ (Scheduled & Auto-Expire):** กำหนด **วันที่เริ่มแสดง (`StartDate`)** และ **วันที่สิ้นสุด (`EndDate`)** ได้ พร้อมเลือกว่าจะให้เปลี่ยนสถานะเป็น **`Disable`** หรือ **ลบประกาศอัตโนมัติ (`Delete`)** เมื่อครบกำหนด และสลับสถานะเปิด/ปิดได้ตลอดเวลาจากรายการผู้ดูแล

### 5. ปฏิทิน พ.ศ. และประวัติการลงเวลา (Calendar & History View)
- แสดงชื่อ-สกุล กะเวลาทำงานประจำตัว และสถิติสะสมประจำเดือน:
  - วันที่มาทำงานปกติ (วัน)
  - วันที่มาสาย (วัน)
  - วันที่ออกก่อนเวลา (วัน)
  - ชั่วโมงทำงานล่วงเวลาสะสม (ชม.)
- ปฏิทินภาษาไทยปี พ.ศ. พร้อมจุดสีสถานะการลงเวลา (เขียว = ปกติ, ส้ม = สาย, แดง = ออกก่อน, ฟ้า = นอกสถานที่/WFH)
- ประวัติการลงเวลาแบบละเอียด พร้อมตัวกรองค้นหาตามช่วงวันที่ และปักหมุดแผนที่จุดที่ลงเวลาจริง

### 6. ระบบยืนยันตัวตนและความปลอดภัย (Authentication & Security)
- ดีไซน์หน้าจอล็อกอินมาตรฐานใหม่ Avatar กลมสีน้ำเงิน พร้อมปุ่มดู/ซ่อนรหัสผ่าน
- รองรับการล็อกอินด้วย **LINE Account**
- รองรับการล็อกอินด้วย **Google Workspace Account**
- รองรับการล็อกอินด้วย **รหัสพนักงาน (EmployeeCode) + รหัสผ่าน** (เข้ารหัส Salted SHA-256)
- ระบบ Session Token หมดอายุอัตโนมัติ ป้องกันการสวมสิทธิ์

### 7. ระบบสายอนุมัติคำขอ (Workflow & Approvals)
- **ขอปรับปรุงเวลา (Time Correction):** กรณีลืมนำโทรศัพท์มาหรือมีเหตุขัดข้อง พร้อมแนบเหตุผลเพื่อส่งให้หัวหน้างานพิจารณา
- **ขอทำงานล่วงเวลา (Overtime - OT):** ส่งคำขอทำโอทีก่อนเริ่มงานจริง คำนวณชั่วโมงให้อัตโนมัติ

### 8. ระบบสื่อสารและศูนย์ช่วยเหลือ (Chat & Support Tickets)
- **ห้องแชตและปรึกษาภายใน (Internal Chat):** สื่อสารและประสานงานภายในองค์กร
- **คลังความรู้ Q&A / FAQs:** รวมคำถามที่พบบ่อยเกี่ยวกับการใช้งานระบบและข้อปฏิบัติ
- **HR Support Tickets:** ระบบเปิดคำร้อง/แจ้งปัญหาต่อฝ่ายบุคคลโดยตรง

### 9. การรายงานและส่งออกข้อมูล (Reports & Export)
- สรุปภาพรวมการเข้างานประจำเดือน
- ส่งออกไฟล์ **CSV พร้อม BOM รองรับภาษาไทยสมบูรณ์** สามารถเปิดบน Microsoft Excel ได้ทันทีโดยไม่เป็นภาษาต่างดาว

---

## 🗄️ โครงสร้างฐานข้อมูล Google Sheets (14 ตาราง)

ฐานข้อมูลจัดเก็บใน Google Spreadsheet (`1KnDb_Pl9cYDhFXjBM-Moe9A3xE-vXDSz2cLMYsfHbQo`) ประกอบด้วย 14 ชีต:

| ตาราง (Sheet Name) | รายละเอียดและโครงสร้างข้อมูล |
|:---|:---|
| **`Users`** | ข้อมูลบุคลากร: `UserID`, `EmployeeCode`, `FullName`, `Email`, `DepartmentID`, `Position`, `Role`, `PasswordHash`, `Salt`, `WorkStart`, `WorkEnd`, `Status` |
| **`Attendance`** | ประวัติการลงเวลา: `AttendanceID`, `UserID`, `WorkDate`, `CheckInTime`, `CheckOutTime`, `Status`, `WorkMode`, `LocationID`, `Latitude`, `Longitude`, `DistanceMeters`, `SelfieUrl` |
| **`Locations`** | พิกัดสถานที่ทำงาน: `LocationID`, `LocationName`, `Address`, `Latitude`, `Longitude`, `RadiusMeter`, `MinAccuracy`, `Status` |
| **`Sessions`** | เซสชันล็อกอิน: `SessionID`, `UserID`, `Token`, `LoginAt`, `ExpireAt`, `DeviceInfo`, `UserAgent`, `Status` |
| **`Notifications`** | ประวัติการแจ้งเตือนและประกาศด่วน: `NotificationID`, `UserID`, `Title`, `Message`, `Type`, `ReadStatus`, `CreatedAt`, `StartDate`, `EndDate`, `ExpireAction`, `Status` |
| **`Departments`** | รายชื่อหน่วยงาน/แผนก: `DepartmentID`, `DepartmentName`, `ParentDepartmentID`, `Status` |
| **`Settings`** | ค่าคอนฟิกูเรชันระบบ: `Key`, `Value`, `Description` |
| **`Auditlogs`** | บันทึกประวัติการเข้าใช้งานและความปลอดภัย: `LogID`, `UserID`, `Action`, `Detail`, `IPAddress`, `UserAgent`, `CreatedAt` |
| **`Holiday`** | ปฏิทินวันหยุด: `HolidayDate`, `HolidayName`, `Type`, `Status` |
| **`CorrectionRequests`** | คำขอปรับปรุงเวลา: `RequestID`, `UserID`, `EmployeeCode`, `FullName`, `TargetDate`, `CorrectTime`, `Type`, `Reason`, `Status`, `ApproverID`, `CreatedAt` |
| **`OvertimeRequests`** | คำขอทำโอที: `RequestID`, `UserID`, `EmployeeCode`, `FullName`, `OTDate`, `StartTime`, `EndTime`, `TotalHours`, `Reason`, `Status`, `ApproverID`, `CreatedAt` |
| **`ChatMessages`** | ข้อความแชต: `MessageID`, `ChannelID`, `SenderID`, `SenderName`, `Content`, `AttachmentUrl`, `CreatedAt` |
| **`FAQItems`** | คำถาม-คำตอบคลังความรู้: `FAQID`, `Category`, `Question`, `Answer`, `OrderNum`, `Status` |
| **`HRTickets`** | เคสคำร้องฝ่ายบุคคล: `TicketID`, `UserID`, `FullName`, `Category`, `Subject`, `Details`, `Status`, `Response`, `ResolvedAt`, `CreatedAt` |

---

## 💻 โครงสร้างไฟล์โค้ดของระบบ (Codebase Architecture)

```text
Time Stamp Attendances/
├── .clasp.json                   # ตั้งค่า Clasp สำหรับการ Deploy ไปยัง Google Apps Script
├── .gitignore                    # ไฟล์และโฟลเดอร์ที่ยกเว้นในการ Commit
├── README.md                     # เอกสารแนะนำระบบและคู่มือหลัก (เอกสารฉบับนี้)
├── INSTALL_GUIDE.md              # คู่มือการติดตั้งและตั้งค่าระบบฉบับสมบูรณ์
└── src/
    ├── appsscript.json           # สิทธิ์การเข้าถึง (Manifest & OAuth Scopes)
    ├── Config.gs                 # การตั้งค่าระบบ, กะงาน, ตารางฐานข้อมูล, รหัสสถานะ
    ├── Utils.gs                  # ตัวช่วยคำนวณพิกัด GPS Haversine, ฟอร์แมต วัน-เวลา พ.ศ., SHA-256
    ├── Db.gs                     # Database Layer จัดการ Sheet CRUD พร้อม LockService ป้องกัน Concurrency
    ├── Setup.gs                  # ระบบสร้างตารางและใส่ข้อมูลเริ่มต้นอัตโนมัติ (Auto Schema Seeder)
    ├── Auth.gs                   # จัดการ Login (LINE, Google, Password), Session & Token
    ├── Attendance.gs             # บันทึกลงเวลาเข้า-ออก, ตรวจสอบ Geofence, บันทึกประวัติ
    ├── Admin.gs                  # จัดการสถานที่ทำงาน (Locations), วันหยุด (Holidays) และการนำเข้าข้อมูล
    ├── Notify.gs                 # จัดการแจ้งเตือนส่วนบุคคล และประกาศแจ้งเตือนพิเศษ (Broadcast Alerts)
    ├── Workflow.gs               # จัดการคำขอปรับปรุงเวลา (Correction) และคำขอทำโอที (Overtime)
    ├── Chat.gs                   # ห้องแชตและคำถามที่พบบ่อย (FAQs)
    ├── Files.gs                  # จัดการไฟล์รูปภาพลง Google Drive
    ├── Reports.gs                # สรุปสถิติประจำเดือน และการ Export CSV รองรับ Excel ภาษาไทย
    ├── Code.gs                   # Web App Entry Point (doGet) และ Universal API Dispatcher
    └── Index.html                # Single Page Application (HTML5, Tailwind CSS, Leaflet.js, FontAwesome)
```

---

## 🛠️ คู่มือการติดตั้งและตั้งค่าระบบ (Installation Guide)

### ขั้นตอนที่ 1: เตรียม Google Spreadsheet และ Google Drive
1. สร้างโฟลเดอร์บน Google Drive หรือใช้โฟลเดอร์โครงการที่มีอยู่
2. สร้าง Google Spreadsheet ใหม่สำหรับทำหน้าที่เป็นฐานข้อมูล
3. คัดลอก Spreadsheet ID (รหัสยาวๆ ใน URL หลัง `/d/` และก่อน `/edit`) นำไปใส่ในไฟล์ `src/Config.gs` ที่ตัวแปร `SPREADSHEET_ID`

### ขั้นตอนที่ 2: Deploy โค้ดไปยัง Google Apps Script (ผ่าน Clasp)
```bash
# 1. ติดตั้ง Clasp แบบ Global (หากยังไม่มี)
npm install -g @google/clasp

# 2. เข้าสู่ระบบ Google Account
clasp login

# 3. ส่งไฟล์โค้ดทั้งหมดขึ้น Google Apps Script
clasp push --force

# 4. สร้าง Release Version และ Deploy Web App
clasp version "TimeStampAttendances V1.0.32"
clasp deploy -i <DEPLOYMENT_ID> -V <VERSION_NUMBER> -d "TimeStampAttendances V1.0.32"
```

### ขั้นตอนที่ 3: สร้างโครงสร้างตารางเริ่มต้น (Database Seeding)
1. เปิด Google Apps Script Editor
2. เลือกฟังก์ชัน **`setupDatabase`** ในไฟล์ `src/Setup.gs` แล้วกดปุ่ม **Run (เรียกใช้)**
3. กดยอมรับสิทธิ์การเข้าถึง (Authorization)
4. ระบบจะทำการสร้างชีตทั้ง 14 ตารางพร้อมตั้งค่าหัวตารางและใส่ข้อมูลเริ่มต้นให้อัตโนมัติ

### ขั้นตอนที่ 4: ตั้งค่าการ Deploy Web App
1. ไปที่เมนู **Deploy** > **Manage deployments**
2. ตรวจสอบการตั้งค่า:
   - **Execute as (เรียกใช้ในฐานะ):** Me (เจ้าของสเปรดชีต)
   - **Who has access (ผู้มีสิทธิ์เข้าถึง):** Anyone (ทุกคน)
3. บันทึกและคัดลอก Web App URL เพื่อส่งให้พนักงานใช้งาน

---

## 👤 บัญชีผู้ใช้เริ่มต้นสำหรับการทดสอบ (Default Accounts)

| ลำดับ | สิทธิ์ (Role) | ชื่อ-สกุล | รหัสพนักงาน (**EmployeeCode**) | รหัสผ่านเริ่มต้น | การเข้าถึงเมนูพิเศษ |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | **Admin** (ผู้ดูแลระบบ) | คุณ เฉลิมพร ถาโคตร | **`E0001`** | `12345` | เข้าถึงเมนู **สถานที่ทำงาน**, **ตั้งค่าวันหยุด**, และ **ประกาศแจ้งเตือนพิเศษ** |
| 2 | **User** (พนักงานทั่วไป) | User Demo | **`E0002`** | `12345` | ลงเวลาเข้า-ออกงาน, ปฏิทิน, ขอปรับปรุงเวลา, ขอโอที, แชต |
| 3 | **Supervisor** (หัวหน้างาน) | HR Demo | **`E0003`** | `12345` | ตรวจสอบและอนุมัติคำขอของพนักงาน |

> 🔒 **ความปลอดภัยรหัสผ่าน:** รหัสผ่านทุกตัวถูกเข้ารหัสด้วย Salted SHA-256 ในฐานข้อมูล ไม่ปรากฏรหัสผ่านแบบข้อความล้วน

---

## 📄 ลิขสิทธิ์และการพัฒนา (License)
พัฒนาและปรับปรุงระบบอย่างต่อเนื่องภายใต้ **MIT License**  
Repository: [https://github.com/longzedesign-dotcom/Time-Stamp-Attendances](https://github.com/longzedesign-dotcom/Time-Stamp-Attendances)
