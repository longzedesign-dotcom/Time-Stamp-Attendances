/**
 * File: Db.gs
 * Description: High-performance Database Layer with LockService and Sheet Caching.
 */

const Db = {
  _spreadsheet: null,
  _sheetCache: {},

  getSpreadsheet() {
    if (this._spreadsheet) return this._spreadsheet;
    try {
      this._spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {
      this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!this._spreadsheet) {
      throw new Error('ไม่สามารถเปิด Google Spreadsheet ได้ กรุณาตรวจสอบ SPREADSHEET_ID');
    }
    return this._spreadsheet;
  },

  getSheet(sheetName) {
    if (this._sheetCache[sheetName]) return this._sheetCache[sheetName];
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    this._sheetCache[sheetName] = sheet;
    return sheet;
  },

  withLock(callback, timeoutMs = 30000) {
    const lock = LockService.getScriptLock();
    const success = lock.tryLock(timeoutMs);
    if (!success) {
      throw new Error('ระบบกำลังประมวลผลคำขอจำนวนมาก กรุณาลองใหม่อีกครั้ง');
    }
    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  },

  getHeaders(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return [];
    return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  },

  setHeaders(sheetName, headers) {
    const sheet = this.getSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2B6CB0').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  },

  getAll(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return [];

    const headers = this.getHeaders(sheetName);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    return data.map((row, index) => {
      const item = { _rowIndex: index + 2 };
      headers.forEach((h, colIndex) => {
        let val = row[colIndex];
        if (val instanceof Date) {
          if (val.getFullYear() === 1899) {
            const hStr = String(val.getHours()).padStart(2, '0');
            const mStr = String(val.getMinutes()).padStart(2, '0');
            val = `${hStr}:${mStr}`;
          } else {
            val = Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM-dd');
          }
        }
        item[h] = val;
      });
      return item;
    });
  },

  find(sheetName, predicate) {
    const all = this.getAll(sheetName);
    return all.filter(predicate);
  },

  findOne(sheetName, predicate) {
    const all = this.getAll(sheetName);
    return all.find(predicate) || null;
  },

  insert(sheetName, obj) {
    return this.withLock(() => {
      const sheet = this.getSheet(sheetName);
      let headers = this.getHeaders(sheetName);

      if (headers.length === 0) {
        headers = Object.keys(obj).filter(k => k !== '_rowIndex');
        this.setHeaders(sheetName, headers);
      }

      const rowValues = headers.map(h => (obj[h] !== undefined && obj[h] !== null ? obj[h] : ''));
      sheet.appendRow(rowValues);
      return obj;
    });
  },

  update(sheetName, predicate, updateObj) {
    return this.withLock(() => {
      const all = this.getAll(sheetName);
      const sheet = this.getSheet(sheetName);
      const headers = this.getHeaders(sheetName);
      let updatedCount = 0;

      all.forEach(item => {
        if (predicate(item)) {
          const rowIndex = item._rowIndex;
          const merged = Object.assign({}, item, updateObj);
          const rowValues = headers.map(h => (merged[h] !== undefined && merged[h] !== null ? merged[h] : ''));
          sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
          updatedCount++;
        }
      });

      return updatedCount;
    });
  },

  delete(sheetName, predicate) {
    return this.withLock(() => {
      const all = this.getAll(sheetName);
      const sheet = this.getSheet(sheetName);
      let deletedCount = 0;
      // Loop backward to keep row indices accurate when deleting
      for (let i = all.length - 1; i >= 0; i--) {
        if (predicate(all[i])) {
          sheet.deleteRow(all[i]._rowIndex);
          deletedCount++;
        }
      }
      return deletedCount;
    });
  }
};
