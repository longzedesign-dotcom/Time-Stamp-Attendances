# 📖 คู่มือการติดตั้งและใช้งาน (Installation Guide)

**โปรเจกต์:** Time Stamp Attendances (OPS MOC Edition)  
**เวอร์ชัน:** 2.0.8

---

## 📌 ข้อมูลทรัพยากรหลักของระบบ (System Resources)

- **โฟลเดอร์ Google Drive:** `1MAGUA7IaoQ-IVbp6IJ7yJIZSGxMXvyrI`  
  (https://drive.google.com/drive/u/0/folders/1MAGUA7IaoQ-IVbp6IJ7yJIZSGxMXvyrI)
- **ฐานข้อมูล Google Spreadsheet:** `1KnDb_Pl9cYDhFXjBM-Moe9A3xE-vXDSz2cLMYsfHbQo`  
  (ชื่อไฟล์: *Timestamp Attendance Database*)
- **GitHub Repository:**  
  https://github.com/longzedesign-dotcom/Time-Stamp-Attendances

---

## 🛠️ ขั้นตอนการติดตั้งและเชื่อมต่อระบบ (Step-by-Step Setup)

### ขั้นตอนที่ 1: ตรวจสอบและตั้งค่า Google Apps Script
1. เปิด **Google Drive Folder:** `1MAGUA7IaoQ-IVbp6IJ7yJIZSGxMXvyrI`
2. เปิดไฟล์สเปรดชีต **Timestamp Attendance Database**
3. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
4. หากต้องการนำไฟล์โค้ดทั้งหมดขึ้นไปยัง Apps Script สามารถใช้คำสั่ง **clasp push** จากเครื่อง หรือคัดลอกไฟล์ในโฟลเดอร์ `src/` ไปวางใน Apps Script Editor:
   - `appsscript.json`
   - `Config.gs`
   - `Utils.gs`
   - `Db.gs`
   - `Setup.gs`
   - `Auth.gs`
   - `Attendance.gs`
   - `Workflow.gs`
   - `Chat.gs`
   - `Files.gs`
   - `Notify.gs`
   - `Reports.gs`
   - `Admin.gs`
   - `Code.gs`
   - `Index.html`

### ขั้นตอนที่ 2: รันคำสั่งสร้างฐานข้อมูลครั้งแรก (Initial Database Setup)
1. ใน Apps Script Editor ให้เลือกฟังก์ชัน **`setupDatabase`** ที่ไฟล์ `Setup.gs`
2. กดปุ่ม **เรียกใช้ (Run)**
3. กดยอมรับและอนุญาตสิทธิ์การเข้าถึง (Authorize Permissions)
4. ฟังก์ชันจะสร้างและตรวจสอบชีตทั้ง 14 ตารางพร้อมหัวตาราง และเพิ่มผู้ใช้งาน Admin เริ่มต้น (`คุณ เฉลิมพร ถาโคตร`) ให้อัตโนมัติ

### ขั้นตอนที่ 3: เผยแพร่เว็บแอป (Deploy as Web App)
1. กดปุ่ม **การทำให้ใช้งานได้ (Deploy)** > **การทำให้ใช้งานได้ใหม่ (New Deployment)**
2. เลือกประเภท: **เว็บแอป (Web app)**
3. ตั้งค่าการเข้าถึง:
   - **เรียกใช้ในฐานะ (Execute as):** ฉัน (me@domain.com)
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** ทุกคน (Anyone)
4. กด **ทำให้ใช้งานได้ (Deploy)**
5. คัดลอก **URL เว็บแอป (Web App URL)** ที่ได้ เพื่อนำไปใช้งานบนคอมพิวเตอร์หรือสมาร์ตโฟนได้ทันที

---

## 👤 บัญชีผู้ใช้งานเริ่มต้นสำหรับการทดสอบ (Default Accounts)

- **บัญชีผู้ดูแลระบบ (Admin / IT Support):**
  - **ชื่อผู้ใช้งาน:** คุณ เฉลิมพร ถาโคตร
  - **อีเมล:** `thakot.ch@gmail.com`
  - **รหัสผ่าน:** `12345678`
  - **สังกัด:** ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร
  - **เวลาปฏิบัติงาน:** 08:30 – 16:30 น.
- **การเข้าใช้งานด่วน (One-Click Login):**
  - กดปุ่ม **ThaID** เพื่อเข้าสู่ระบบในฐานะเจ้าหน้าที่ทันที
  - หรือกดปุ่ม **MOC Account** แล้วระบุอีเมลกระทรวงพาณิชย์
