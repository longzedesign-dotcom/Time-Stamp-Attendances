# ข้อกำหนดมาตรฐาน Source Code Header ระดับองค์กร (Enterprise Source Code Header Specification)
### ระบบลงเวลาเข้างานออนไลน์ประจำหน่วยงาน (Time Stamp Attendances : TSA)
**เอกสารเลขที่:** STD-TSA-DEV-001  
**เวอร์ชันมาตรฐาน:** 1.0.0 (มีผลบังคับใช้ตั้งแต่วันที่ 18 พฤศจิกายน 2569)  
**สถานะ:** บังคับใช้ในทุกไฟล์ของระบบ (Mandatory)

---

## 1. วัตถุประสงค์ (Purpose)

ข้อกำหนดนี้จัดทำขึ้นเพื่อกำหนดรูปแบบมาตรฐานเดียวกัน (Standardization) สำหรับส่วนหัวของไฟล์ต้นฉบับ (Source Code Header) ทั้งหมดในระบบ **Time Stamp Attendances (TSA)** เพื่อ:
1. ระบุเอกลักษณ์ ความเป็นเจ้าของ และสิทธิประโยชน์ทางกฎหมายขององค์กรอย่างชัดเจน
2. เชื่อมโยงระบุตัวตนระหว่างไฟล์ต้นฉบับใน Local Repository และโปรเจกต์จริงบน Google Cloud / Apps Script Server
3. อำนวยความสะดวกในการตรวจสอบย้อนกลับ (Traceability) ของสถาปัตยกรรมระบบ การแก้ไข และประวัติเวอร์ชัน (Revision History)
4. สอดคล้องตามมาตรฐานการพัฒนาซอฟต์แวร์ระดับสากลและระบบบริหารจัดการคุณภาพความมั่นคงปลอดภัยสารสนเทศ ISO/IEC 27001

---

## 2. ขอบเขตการบังคับใช้ (Scope)

มาตรฐานนี้ใช้บังคับกับไฟล์ต้นทางทั้งหมดในโฟลเดอร์ `src/` และเอกสารประกอบการพัฒนาของโปรเจกต์ ได้แก่:
* ไฟล์เซิร์ฟเวอร์สคริปต์ Google Apps Script (`.gs`)
* ไฟล์หน้าจอเว็บแอปพลิเคชัน Single Page Application (`.html`)
* ไฟล์การตั้งค่า Manifest และ JSON (`.json`)
* ไฟล์โมดูลและสคริปต์ส่วนขยายในอนาคต

---

## 3. โครงสร้างฟิลด์มาตรฐานของ Header (Header Field Specifications)

ทุกไฟล์ต้นฉบับจะต้องมีฟิลด์ข้อมูลบังคับตามตารางดังต่อไปนี้:

| ฟิลด์ข้อมูล (Field) | ความสำคัญ | คำอธิบายและข้อกำหนด | ตัวอย่างค่า |
| :--- | :---: | :--- | :--- |
| **Project** | บังคับ | ชื่อโปรเจกต์ทางการของระบบ | `Time Stamp Attendances (TSA Enterprise Edition)` |
| **Script ID** | บังคับ | รหัสโปรเจกต์จริงบน Google Apps Script Server | `17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4` |
| **Repository** | บังคับ | URL ของคลังเก็บโค้ดต้นทางอย่างเป็นทางการ (GitHub) | `https://github.com/longzedesign-dotcom/Time-Stamp-Attendances` |
| **File** | บังคับ | ชื่อไฟล์พร้อมนามสกุลให้ตรงกับระบบไฟล์ | `Admin.gs` หรือ `Index.html` |
| **Module/Layer** | บังคับ | สถาปัตยกรรมและเลเยอร์หน้าที่ของไฟล์นั้นๆ | `Backend / Administrative Management & System Configuration` |
| **Description** | บังคับ | สรุปภารกิจและหน้าที่การทำงานหลักของไฟล์ | `บริหารจัดการข้อมูลผู้ใช้, พิกัดสถานที่ทำงาน, วันหยุด และนำเข้าข้อมูล CSV` |
| **Version** | บังคับ | หมายเลขเวอร์ชันตาม Semantic Versioning (SemVer) | `1.0.45` |
| **Author** | บังคับ | ทีมงานหรือผู้ออกแบบและพัฒนาหลัก | `TSA Engineering Team` |
| **Created Date** | บังคับ | วันที่สร้างไฟล์ครั้งแรกในรูปแบบ `YYYY-MM-DD` | `2026-11-08` |
| **Last Modified** | บังคับ | วันที่ทำการแก้ไขและเผยแพร่ล่าสุด `YYYY-MM-DD` | `2026-11-18` |
| **License** | บังคับ | ประเภทสัญญาอนุญาตการใช้งาน | `Proprietary / Enterprise Internal Use` |
| **Copyright (c)** | บังคับ | ข้อความประกาศลิขสิทธิ์ประจำปีของระบบ | `2026 Time Stamp Attendances. All rights reserved.` |
| **Revision History** | แนะนำ | บันทึกประวัติการปรับปรุงย่อในไฟล์ | ระบุเวอร์ชัน วันที่ และสาระสำคัญที่แก้ไข |

---

## 4. แม่แบบมาตรฐานตามประเภทไฟล์ (Standard Templates by File Type)

### 4.1 รูปแบบสำหรับไฟล์ Google Apps Script (`.gs`)
ต้องเขียนในรูปแบบ JSDoc Block Comment (`/** ... */`) ที่บรรทัดแรกสุดของไฟล์:

```javascript
/**
 * ==============================================================================
 * Project       : Time Stamp Attendances (TSA Enterprise Edition)
 * Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
 * Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
 * File          : [Filename.gs]
 * Module/Layer  : [Architecture Layer / Module Name]
 * Description   : [Detailed Description of Module Functionality]
 * Version       : 1.0.xx
 * Author        : TSA Engineering Team
 * Created Date  : YYYY-MM-DD
 * Last Modified : YYYY-MM-DD
 * License       : Proprietary / Enterprise Internal Use
 * Copyright (c) : 2026 Time Stamp Attendances. All rights reserved.
 * ------------------------------------------------------------------------------
 * Revision History:
 * - V1.0.xx (YYYY-MM-DD) : Initial Implementation
 * ==============================================================================
 */
```

### 4.2 รูปแบบสำหรับไฟล์ Web Presentation HTML (`.html`)
ต้องเขียนในรูปแบบ HTML Comment (`<!-- ... -->`) ที่บรรทัดแรกสุดของไฟล์ ก่อนแท็ก `<!DOCTYPE html>`:

```html
<!--
==============================================================================
Project       : Time Stamp Attendances (TSA Enterprise Edition)
Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
File          : Index.html
Module/Layer  : Presentation / Single Page Application (UI/UX Engine)
Description   : [Detailed Description of Frontend Modules and Views]
Version       : 1.0.xx
Author        : TSA Engineering Team
Created Date  : YYYY-MM-DD
Last Modified : YYYY-MM-DD
License       : Proprietary / Enterprise Internal Use
Copyright (c) : 2026 Time Stamp Attendances. All rights reserved.
==============================================================================
-->
```

---

## 5. กฎระเบียบในการนับเวอร์ชันและการ Deploy (Versioning & Deployment Policy)

1. **Semantic Versioning:** ระบบใช้เกณฑ์ `MAJOR.MINOR.PATCH`
   * การแก้ไขบั๊ก ปรับปรุงความแม่นยำ หรือปรับแต่งฟอร์ม ให้เพิ่มค่า Patch `+1` เสมอ (`V1.0.44` -> `V1.0.45`)
2. **การซิงค์ทุกไฟล์ก่อน Deploy:**
   * ต้องปรับปรุงค่า `APP_VERSION` ใน `src/Config.gs`
   * ต้องปรับปรุง Header ในทุกไฟล์ใน `src/*.gs` และ `src/Index.html` ให้เป็นเลขเวอร์ชันเดียวกัน
   * ต้องบันทึกรายละเอียดการเปลี่ยนแปลงลงใน `CHANGELOG.md`
3. **การส่งขึ้น Server และ GitHub:**
   * ใช้คำสั่ง `clasp push --force` และ `clasp deploy -i <DEPLOYMENT_ID> -d "TSA V1.0.xx: ..."`
   * ตรวจสอบ HTTP Status 200 บน Production Web App URL
   * ทำการ `git commit` และ `git push origin main` ทุกครั้งทันทีหลังการ Deploy
