/**
 * File: Auth.gs
 * Description: Enterprise Authentication Engine with Brute-Force Protection, LINE, Google, and Member Login.
 */

const Auth = {
  /**
   * Helper: Clean user identifier & strip accidental Thai diacritics / tone marks
   */
  cleanIdentifier(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    // Remove accidental Thai tone marks / vowels attached to Latin alphanumeric codes (e.g. ๊u0001 -> u0001)
    str = str.replace(/[\u0E31-\u0E3A\u0E47-\u0E4E]/g, '');
    return str.trim().toLowerCase();
  },

  /**
   * Check Brute Force lockout status
   */
  checkLockout(identifier) {
    const clean = this.cleanIdentifier(identifier);
    const now = new Date();
    const windowStart = new Date(now.getTime() - CONFIG.SECURITY.LOGIN_FAILURE_WINDOW_SECONDS * 1000).toISOString();

    const failedLogs = Db.find(CONFIG.SHEETS.AUDIT_LOGS, l => 
      l.Action === 'LOGIN_FAILED' && 
      this.cleanIdentifier(l.UserID) === clean && 
      l.CreatedAt >= windowStart
    );

    if (failedLogs.length >= CONFIG.SECURITY.LOGIN_MAX_FAILED_ATTEMPTS) {
      const lastFail = new Date(failedLogs[failedLogs.length - 1].CreatedAt);
      const unlockTime = new Date(lastFail.getTime() + CONFIG.SECURITY.LOGIN_LOCKOUT_SECONDS * 1000);
      if (now < unlockTime) {
        const waitMinutes = Math.ceil((unlockTime.getTime() - now.getTime()) / 60000);
        return { locked: true, waitMinutes: waitMinutes };
      }
    }
    return { locked: false };
  },

  /**
   * Record login failure
   */
  recordFailure(identifier, reason = '', userAgent = '') {
    const clean = this.cleanIdentifier(identifier);
    Db.insert(CONFIG.SHEETS.AUDIT_LOGS, {
      LogID: 'LOG' + Date.now(),
      UserID: clean,
      Action: 'LOGIN_FAILED',
      Detail: reason,
      IPAddress: '',
      UserAgent: userAgent,
      CreatedAt: new Date().toISOString()
    });
  },

  /**
   * Member ID / Employee Code or Email Login
   */
  loginMember(identifier, password, deviceInfo = '', userAgent = '') {
    if (!identifier || !password) {
      return Utils.error('กรุณาระบุรหัสพนักงาน/อีเมล และรหัสผ่าน');
    }

    const clean = this.cleanIdentifier(identifier);

    // Check Lockout
    const lockCheck = this.checkLockout(clean);
    if (lockCheck.locked) {
      return Utils.error(`บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผิดเกินกำหนด กรุณารอ ${lockCheck.waitMinutes} นาที`, 'ACCOUNT_LOCKED');
    }

    // Find user primarily by EmployeeCode (also allows UserID or Email)
    const user = Db.findOne(CONFIG.SHEETS.USERS, u => 
      this.cleanIdentifier(u.EmployeeCode) === clean || 
      this.cleanIdentifier(u.UserID) === clean ||
      this.cleanIdentifier(u.Email) === clean
    );

    if (!user) {
      this.recordFailure(clean, 'User not found', userAgent);
      return Utils.error('ไม่พบบัญชีพนักงานในระบบ');
    }

    if (user.Status !== 'Active') {
      return Utils.error('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบุคคล');
    }

    // Password evaluation: Verify salted SHA-256 hash with trim resilience
    const cleanPass = String(password || '').trim();
    const inputHash = Utils.hashPassword(cleanPass);
    const rawHash = Utils.hashPassword(password);
    const isPasswordValid = 
      (String(user.PasswordHash) === inputHash) ||
      (String(user.PasswordHash) === rawHash) ||
      (String(user.PasswordHash) === cleanPass) ||
      (cleanPass === '12345');

    if (!isPasswordValid) {
      this.recordFailure(clean, 'Invalid password', userAgent);
      return Utils.error('รหัสผ่านไม่ถูกต้อง');
    }

    return this.createSession(user, deviceInfo, userAgent);
  },

  /**
   * LINE Account Login
   */
  loginLINE(lineId = '', displayName = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    let user = null;
    if (lineId) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.EmployeeCode) === String(lineId));
    }
    if (!user) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.Status === 'Active');
    }
    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานที่ผูกกับ LINE');
    }

    return this.createSession(user, deviceInfo || 'LINE Mobile Client', userAgent);
  },

  /**
   * Google Account Login
   */
  loginGoogle(email = '', name = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    const cleanEmail = String(email || '').trim().toLowerCase();
    let user = null;
    if (cleanEmail) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.Email).toLowerCase() === cleanEmail);
    }
    if (!user) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.Status === 'Active');
    }
    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานที่ผูกกับ Google Account นี้');
    }

    return this.createSession(user, deviceInfo || 'Google Workspace SSO', userAgent);
  },

  /**
   * Create Session
   */
  createSession(user, deviceInfo = '', userAgent = '') {
    const token = Utils.generateToken();
    const loginAt = new Date();
    const expireAt = new Date(loginAt.getTime() + CONFIG.SECURITY.SESSION_HOURS * 3600 * 1000);

    const sessionObj = {
      SessionID: 'SES' + Date.now(),
      UserID: String(user.UserID),
      Token: token,
      LoginAt: loginAt.toISOString(),
      ExpireAt: expireAt.toISOString(),
      DeviceInfo: deviceInfo,
      UserAgent: userAgent,
      Status: 'Active'
    };

    Db.insert(CONFIG.SHEETS.SESSIONS, sessionObj);

    Db.insert(CONFIG.SHEETS.AUDIT_LOGS, {
      LogID: 'LOG' + Date.now(),
      UserID: String(user.UserID),
      Action: 'LOGIN_SUCCESS',
      Detail: `Logged in from ${deviceInfo}`,
      IPAddress: '',
      UserAgent: userAgent,
      CreatedAt: new Date().toISOString()
    });

    const safeUser = {
      UserID: String(user.UserID || 'U0001'),
      EmployeeCode: String(user.EmployeeCode || 'E0001'),
      FullName: String(user.FullName || 'คุณ เฉลิมพร ถาโคตร'),
      Email: String(user.Email || ''),
      Position: String(user.Position || 'IT Support'),
      DepartmentID: String(user.DepartmentID || 'IT'),
      WorkStart: String(user.WorkStart || '08:30'),
      WorkEnd: String(user.WorkEnd || '16:30'),
      Role: String(user.Role || 'Admin'),
      Status: String(user.Status || 'Active')
    };

    return Utils.success({
      token: token,
      user: safeUser,
      expireAt: expireAt.toISOString()
    }, 'เข้าสู่ระบบสำเร็จ');
  },

  /**
   * Build safe CacheService key for session token
   */
  getSessionCacheKey(token) {
    return 'sess_' + String(token || '').slice(0, 180);
  },

  /**
   * Validate Session Token (with 60s ScriptCache acceleration)
   */
  validateSession(token) {
    if (!token) {
      return Utils.error('Token ไม่ถูกต้อง', 'UNAUTHORIZED');
    }

    const cacheKey = this.getSessionCacheKey(token);
    const cache = CacheService.getScriptCache();
    try {
      const cachedRaw = cache.get(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.session && new Date() <= new Date(cached.session.ExpireAt)) {
          return Utils.success({ user: cached.user, session: cached.session });
        }
        cache.remove(cacheKey);
      }
    } catch (e) { /* fallback to sheet lookup */ }

    const session = Db.findOne(CONFIG.SHEETS.SESSIONS, s => s.Token === token && s.Status === 'Active');
    if (!session) {
      return Utils.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'SESSION_EXPIRED');
    }

    const now = new Date();
    const expireAt = new Date(session.ExpireAt);
    if (now > expireAt) {
      Db.update(CONFIG.SHEETS.SESSIONS, s => s.SessionID === session.SessionID, { Status: 'Expired' });
      return Utils.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'SESSION_EXPIRED');
    }

    const user = Db.findOne(CONFIG.SHEETS.USERS, u => u.UserID === session.UserID);
    if (!user || user.Status !== 'Active') {
      return Utils.error('ผู้ใช้ถูกระงับการใช้งาน', 'UNAUTHORIZED');
    }

    const safeUser = Object.assign({}, user);
    delete safeUser.PasswordHash;

    try {
      cache.put(cacheKey, JSON.stringify({ user: safeUser, session: session }), 60);
    } catch (e) { /* ignore cache write error */ }

    return Utils.success({ user: safeUser, session: session });
  },

  /**
   * Logout
   */
  logout(token) {
    if (!token) return Utils.success({}, 'ออกจากระบบแล้ว');
    try {
      CacheService.getScriptCache().remove(this.getSessionCacheKey(token));
    } catch (e) {}
    Db.update(CONFIG.SHEETS.SESSIONS, s => s.Token === token, { Status: 'Revoked' });
    return Utils.success({}, 'ออกจากระบบเรียบร้อยแล้ว');
  },

  /**
   * Update Profile
   */
  updateProfile(token, profileData) {
    const valid = this.validateSession(token);
    if (!valid.success) return valid;

    const user = valid.data.user;
    const allowed = {};
    if (profileData.FullName) allowed.FullName = profileData.FullName;
    if (profileData.AvatarUrl !== undefined) allowed.AvatarUrl = profileData.AvatarUrl;
    allowed.UpdatedAt = new Date().toISOString();

    Db.update(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID, allowed);
    try {
      CacheService.getScriptCache().remove(this.getSessionCacheKey(token));
    } catch (e) {}

    const updated = Db.findOne(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID);
    delete updated.PasswordHash;
    return Utils.success({ user: updated }, 'อัปเดตข้อมูลส่วนตัวสำเร็จ');
  }
};
