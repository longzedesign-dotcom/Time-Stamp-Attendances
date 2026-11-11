/**
 * File: Files.gs
 * Description: Google Drive integration for storing Selfie images and verification files.
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
   * Upload Profile Avatar image to Google Drive and return direct display URL
   */
  uploadAvatar(base64Data, userCode = 'USER') {
    if (!base64Data) return null;
    try {
      const folder = this.getOrCreateSubfolder('Profile_Avatars');
      const cleanBase64 = String(base64Data).replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, '');
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const safeCode = String(userCode || 'USER').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Avatar_${safeCode}_${Date.now()}.jpg`;
      const blob = Utilities.newBlob(decodedBytes, 'image/jpeg', filename);
      const file = folder.createFile(blob);

      let shared = false;
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        shared = true;
      } catch (shareErr) {
        Logger.log('Avatar sharing fallback: ' + shareErr.toString());
      }

      const fileId = file.getId();
      return {
        fileId: fileId,
        viewUrl: file.getUrl(),
        imageUrl: `https://lh3.googleusercontent.com/d/${fileId}=s400`,
        shared: shared
      };
    } catch (err) {
      Logger.log('Error uploading avatar: ' + err.toString());
      return null;
    }
  }
};
