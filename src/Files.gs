/**
 * ==============================================================================
 * Project       : Time Stamp Attendances (TSA Enterprise Edition)
 * Script ID     : 17h7De_f5Dl_Uf5x0HG3mSj89EZ2gHf4Ji1N-5p6-sBrdhO3Ny01AK8i4
 * Repository    : https://github.com/longzedesign-dotcom/Time-Stamp-Attendances
 * File          : Files.gs
 * Module/Layer  : Storage / Google Drive Media & Asset Storage Service
 * Description   : จัดการอัปโหลดภาพถ่าย Selfie, รูปภาพโปรไฟล์ และจัดเก็บไฟล์โลโก้รายงานลงใน Google Drive
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

const Files = {
  /**
   * Get or create a named subfolder inside DRIVE_FOLDER_ID (fallback to Drive root)
   */
  getOrCreateSubfolder(folderName) {
    let parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch (e) {
      parentFolder = DriveApp.getRootFolder();
    }

    const subfolders = parentFolder.getFoldersByName(folderName);
    if (subfolders.hasNext()) {
      return subfolders.next();
    }
    return parentFolder.createFolder(folderName);
  },

  /**
   * Get or create the Selfie storage folder in Google Drive
   */
  getSelfieFolder() {
    return this.getOrCreateSubfolder(CONFIG.SELFIES_FOLDER_NAME);
  },

  /**
   * Upload base64 encoded image to Google Drive
   */
  uploadSelfie(base64Data, userCode, type = 'IN') {
    if (!base64Data) return '';
    try {
      const folder = this.getSelfieFolder();
      const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/i, '');
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const filename = `Selfie_${userCode}_${type}_${Date.now()}.jpg`;
      const blob = Utilities.newBlob(decodedBytes, 'image/jpeg', filename);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    } catch (err) {
      Logger.log('Error uploading selfie: ' + err.toString());
      return '';
    }
  },

  /**
   * Shared helper: Upload base64 image to a named Drive subfolder and return direct display URL
   */
  uploadPublicImage(folderName, base64Data, filePrefix = 'IMG') {
    if (!base64Data) return null;
    try {
      const folder = this.getOrCreateSubfolder(folderName);
      const cleanBase64 = String(base64Data).replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, '');
      const mimeMatch = String(base64Data).match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/i);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ext = mimeType.indexOf('png') !== -1 ? 'png' : 'jpg';
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const safePrefix = String(filePrefix || 'IMG').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safePrefix}_${Date.now()}.${ext}`;
      const blob = Utilities.newBlob(decodedBytes, mimeType, filename);
      const file = folder.createFile(blob);

      let shared = false;
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        shared = true;
      } catch (shareErr) {
        Logger.log('Image sharing fallback: ' + shareErr.toString());
      }

      const fileId = file.getId();
      return {
        fileId: fileId,
        viewUrl: file.getUrl(),
        imageUrl: `https://lh3.googleusercontent.com/d/${fileId}=s400`,
        shared: shared
      };
    } catch (err) {
      Logger.log('Error uploading image: ' + err.toString());
      return null;
    }
  },

  /**
   * Upload Profile Avatar image to Google Drive and return direct display URL
   */
  uploadAvatar(base64Data, userCode = 'USER') {
    const safeCode = String(userCode || 'USER').replace(/[^a-zA-Z0-9_-]/g, '_');
    return this.uploadPublicImage('Profile_Avatars', base64Data, `Avatar_${safeCode}`);
  },

  /**
   * Upload Attendance Report Form Logo to Google Drive and return direct display URL
   */
  uploadReportLogo(base64Data) {
    return this.uploadPublicImage('Report_Assets', base64Data, 'ReportLogo');
  }
};
