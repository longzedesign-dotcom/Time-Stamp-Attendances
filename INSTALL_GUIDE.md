# 📖 คู่มือการติดตั้งและตั้งค่าระบบฉบับสมบูรณ์ (Installation & Administration Guide)

<div align="center">

# ระบบลงเวลาเข้างานออนไลน์ประจำหน่วยงาน (Time Stamp Attendances)
### เวอร์ชันปัจจุบัน: TimeStampAttendances V1.0.30 (Deployment Version 25)

</div>

---

## 📌 ทรัพยากรและรหัสประจำระบบ (System Resources)

- **Production Web App URL:**  
  [https://script.google.com/macros/s/AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q/exec](https://script.google.com/macros/s/AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q/exec)
- **Deployment ID:** `AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q`
- **Google Drive Project Folder:** `1MAGUA7IaoQ-IVbp6IJ7yJIZSGxMXvyrI`
- **Google Spreadsheet Database ID:** `1KnDb_Pl9cYDhFXjBM-Moe9A3xE-vXDSz2cLMYsfHbQo` (ชื่อไฟล์: *Timestamp Attendance Database*)
- **GitHub Repository:** [https://github.com/longzedesign-dotcom/Time-Stamp-Attendances](https://github.com/longzedesign-dotcom/Time-Stamp-Attendances)

---

## 🛠️ ขั้นตอนการติดตั้งระบบทีละขั้นตอน (Step-by-Step Installation)

### ขั้นตอนที่ 1: การเตรียมโฟลเดอร์ Google Drive และ Google Sheets

1. เข้าไปที่ **Google Drive** ของคุณ สร้างโฟลเดอร์สำหรับโปรเจกต์ เช่น `Time Stamp Attendances`
2. สร้าง Google Spreadsheet เปล่า 1 ไฟล์ ตั้งชื่อว่า `Timestamp Attendance Database`
3. คัดลอก **Spreadsheet ID** จากแถบ URL ของเบราว์เซอร์:
   ```text
   https://docs.google.com/spreadsheets/d/ <SPREADSHEET_ID> /edit
   ```
4. นำ ID นี้ไปแทนที่ในไฟล์ `src/Config.gs`:
   ```javascript
   SPREADSHEET_ID: '1KnDb_Pl9cYDhFXjBM-Moe9A3xE-vXDSz2cLMYsfHbQo',
   ```

---

### ขั้นตอนที่ 2: การ Deploy ซอร์สโค้ดไปยัง Google Apps Script

#### วิธีที่ A: ใช้ Clasp ผ่าน Terminal (แนะนำสำหรับนักพัฒนา)
```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd "Time Stamp Attendances"

# 2. ทำการ Login ด้วย Google Account ที่เป็นเจ้าของสเปรดชีต
npx clasp login

# 3. อัปโหลดโค้ดทั้งหมดไปยัง Apps Script
npx clasp push --force

# 4. สร้าง Release Version ใหม่
npx clasp version "TimeStampAttendances V1.0.30"

# 5. สั่ง Deploy อัปเดตไปยัง Deployment เดิม
npx clasp deploy -i AKfycby3WoJljZRlZ3NvFY-wrQcKIcw8lLZCgxVk75-_B1zDUYFZRFNP_opcGfPfm1QX09P56Q -V 25 -d "TimeStampAttendances V1.0.30"
```

#### วิธีที่ B: คัดลอกโค้ดผ่าน Google Apps Script Editor
1. เปิด Google Spreadsheet ที่สร้างไว้
2. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
3. สร้างไฟล์ `.gs` และไฟล์ `.html` ตามโครงสร้างในโฟลเดอร์ `src/` (ทั้งหมด 15 ไฟล์)
4. คัดลอกโค้ดจากแต่ละไฟล์ไปวางให้ตรงกันทุกไฟล์

---

### ขั้นตอนที่ 3: การรันสร้างฐานข้อมูลอัตโนมัติ (Database Seeding)

1. ในหน้าต่าง **Apps Script Editor** ให้มองหาแถบเลือกฟังก์ชันที่ด้านบน
2. เลือกฟังก์ชัน **`setupDatabase`** (อยู่ในไฟล์ `src/Setup.gs`)
3. กดปุ่ม **เรียกใช้ (Run)**
4. ระบบจะแสดงหน้าต่างขออนุญาตสิทธิ์การเข้าถึง (Authorization Required):
   - คลิก **ตรวจสอบสิทธิ์ (Review Permissions)**
   - เลือกบัญชี Google ของคุณ
   - คลิก **ขั้นสูง (Advanced)** > **ไปที่ Time Stamp Attendances (ไม่ปลอดภัย) / Go to project**
   - คลิก **อนุญาต (Allow)**
5. ฟังก์ชันจะสร้างชีตทั้ง 14 ตาราง พร้อมโครงสร้างหัวตารางและใส่ข้อมูลตั้งต้น (ผู้ใช้งาน Admin, รายชื่อสถานที่, หมวดหมู่คำถาม) ให้โดยอัตโนมัติ 100%

---

### ขั้นตอนที่ 4: การตั้งค่าสิทธิ์และการเผยแพร่เว็บแอป (Web App Deployment Settings)

1. ใน Apps Script Editor คลิกปุ่ม **การทำให้ใช้งานได้ (Deploy)** > **จัดการการทำให้ใช้งานได้ (Manage deployments)**
2. คลิกไอคอนรูปดินสอ เพื่อแก้ไขการตั้งค่า:
   - **การกำหนดค่า (Configuration):**
     - **เรียกใช้ในฐานะ (Execute as):** `ฉัน (Me)`
     - **ผู้ที่มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(จำเป็นต้องเลือก Anyone เพื่อให้พนักงานทุกคนสามารถเข้าใช้งานผ่านอุปกรณ์ของตนเองได้)*
3. คลิก **การทำให้ใช้งานได้ (Deploy)**
4. นำ **URL เว็บแอป (Web App URL)** ส่งให้บุคลากรในหน่วยงานเข้าใช้งานได้ทันที

---

## ⚙️ คู่มือสำหรับผู้ดูแลระบบ (Administrator Manual)

### 1. การจัดการสถานที่ทำงานและไซต์งาน (Locations & Sites)
1. เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (**`E0001`**)
2. ไปที่แท็บ **โปรไฟล์** > เมนู **"สถานที่ทำงาน"** (ไอคอน Pin สีแดงกุหลาบ)
3. คลิกปุ่ม **`[+ เพิ่มสถานที่]`**:
   - กรอกชื่อสถานที่ เช่น *"สำนักงานใหญ่"*, *"Site ก่อสร้าง A"*
   - คลิกปุ่ม **"ดึงพิกัดปัจจุบัน"** เพื่ออ่านค่า Latitude/Longitude จาก GPS เครื่องของคุณ
   - เลือกระยะรัศมีลงเวลา (Geofence Radius) เช่น 100ม., 200ม., 500ม. หรือ 1,000ม.
   - กดบันทึกข้อมูล
4. **การเปิด/ปิดใช้งานสถานที่:** สามารถกดปุ่ม **Toggle Switch** สไตล์ iOS หน้าสถานที่นั้นๆ เพื่อเปิดหรือปิดรับการลงเวลาได้ทันที

### 2. การจัดการวันหยุดและนำเข้าวันหยุดทั้งปี (Holidays Management)
1. ไปที่แท็บ **โปรไฟล์** > เมนู **"ตั้งค่าวันหยุด"** (ไอคอน Alarm สีแดง)
2. **การนำเข้าอัตโนมัติในคลิกเดียว (1-Click Preset):**
   - คลิกปุ่ม **`[นำเข้าข้อมูล]`** (อยู่ด้านหน้าปุ่มเพิ่มวันหยุด)
   - เลือกปี พ.ศ. (เช่น 2569 / 2026)
   - ระบบจะโหลดรายการวันหยุดราชการไทยทั้งหมดล่วงหน้าขึ้นมาให้ตรวจสอบ
   - คลิกปุ่ม **"นำเข้าวันหยุดทั้งปีทันที"**
3. **การนำเข้าแบบกำหนดเอง:** เลือกแท็บ "กำหนดเอง / วางข้อความ CSV" วางข้อมูล `YYYY-MM-DD, ชื่อวันหยุด, ประเภท` แล้วกดยืนยัน

### 3. การส่งประกาศแจ้งเตือนพิเศษฉุกเฉิน (Special Broadcast Announcements)
1. ไปที่แท็บ **โปรไฟล์** > เมนู **"การแจ้งเตือน"** (ไอคอนกระดิ่งสีส้ม)
2. คลิกปุ่ม **`[+ เพิ่มประกาศพิเศษ]`**
3. เลือกประเภทเหตุการณ์:
   - 🦠 โรคระบาด
   - 🌊 น้ำท่วม
   - 🏢 แผ่นดินไหว
   - ⭐ วันหยุดพิเศษที่บริษัทกำหนด
   - 🚨 เหตุฉุกเฉิน / ภัยพิบัติเร่งด่วน
   - 📢 ประกาศสำคัญทั่วไป
4. ระบุหัวข้อและข้อความคำสั่ง แล้วคลิก **"ส่งประกาศทันที"**
5. แถบประกาศจะปรากฏบนหน้าหลักของพนักงานทุกคนทันที

---

## 👥 ข้อมูลบัญชีผู้ใช้งานเริ่มต้น (Default Test Accounts)

| ลำดับ | บทบาท (Role) | ชื่อ-สกุล | รหัสพนักงาน (**EmployeeCode**) | รหัสผ่านเริ่มต้น | การเข้าถึง |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | **Admin** (ผู้ดูแลระบบ) | คุณ เฉลิมพร ถาโคตร | **`E0001`** | `12345` | สิทธิ์เต็มทุกเมนู (สถานที่ทำงาน, วันหยุด, ประกาศฉุกเฉิน) |
| 2 | **User** (พนักงานทั่วไป) | User Demo | **`E0002`** | `12345` | ลงเวลาเข้า-ออก, ปฏิทิน, ขอปรับปรุงเวลา, ขอโอที, แชต |
| 3 | **Supervisor** (หัวหน้างาน) | HR Demo | **`E0003`** | `12345` | อนุมัติคำขอปรับปรุงเวลาและโอทีของพนักงาน |

---

## ❓ การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

### Q: พนักงานเปิดแอปแล้วขึ้นว่า "ไม่สามารถระบุพิกัดได้ (กรุณาเปิด GPS)"
- **สาเหตุ:** เบราว์เซอร์หรืออุปกรณ์ยังไม่ได้อนุญาตสิทธิ์การเข้าถึงตำแหน่ง (Location Permission)
- **วิธีแก้ไข:** แนะนำให้พนักงานกดที่ไอคอนแม่กุญแจหน้ารายการ URL ในเบราว์เซอร์ แล้วเลือก **อนุญาตการเข้าถึงตำแหน่ง (Allow Location)** จากนั้นรีเฟรชหน้าจอ 1 ครั้ง

### Q: แก้ไขโค้ดแล้วทำไมหน้าเว็บบนมือถือยังเป็นเวอร์ชันเก่า?
- **สาเหตุ:** แคชของเบราว์เซอร์ หรือยังไม่ได้สร้าง Deployment Version ใหม่ใน Apps Script
- **วิธีแก้ไข:** เมื่อแก้ไขโค้ดต้องสร้าง Version ใหม่ (`clasp version` และ `clasp deploy`) เสมอ และสั่ง Hard Refresh เบราว์เซอร์บนมือถือ
