/**
 * File: Files.gs
 * Description: Google Drive integration for storing Selfie images and verification files.
 */

const Files = {
  /**
   * Get or create the Selfie storage folder in Google Drive
   */
  getSelfieFolder() {
    let parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch (e) {
      parentFolder = DriveApp.getRootFolder();
    }

    const subfolders = parentFolder.getFoldersByName(CONFIG.SELFIES_FOLDER_NAME);
    if (subfolders.hasNext()) {
      return subfolders.next();
    }
    return parentFolder.createFolder(CONFIG.SELFIES_FOLDER_NAME);
  },

  /**
   * Upload base64 encoded image to Google Drive
   */
  uploadSelfie(base64Data, userCode, type = 'IN') {
    if (!base64Data) return '';
    try {
      const folder = this.getSelfieFolder();
      const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
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
  }
};
