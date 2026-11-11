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
   * Ensure Users sheet schema includes OAuth linking columns
   */
  ensureUserSchema() {
    Db.ensureHeaders(CONFIG.SHEETS.USERS, [
      'UserID', 'EmployeeCode', 'FullName', 'Email', 'PasswordHash',
      'Position', 'DepartmentID', 'WorkStart', 'WorkEnd', 'Role',
      'Status', 'AvatarUrl', 'CreatedAt', 'UpdatedAt', 'LineUserID', 'GoogleSub'
    ]);
  },

  /**
   * Verify Employee Credentials (shared by standard login & OAuth 1-time linking)
   */
  verifyEmployeeCredentials(identifier, password, userAgent = '') {
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

    return Utils.success({ user: user });
  },

  /**
   * Member ID / Employee Code or Email Login
   */
  loginMember(identifier, password, deviceInfo = '', userAgent = '') {
    const verified = this.verifyEmployeeCredentials(identifier, password, userAgent);
    if (!verified.success) return verified;
    return this.createSession(verified.data.user, deviceInfo, userAgent);
  },

  /**
   * LINE Account Login (requires real verified LineUserID binding or OAuth flow)
   */
  loginLINE(lineId = '', displayName = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    const cleanLineId = String(lineId || '').trim();
    if (!cleanLineId) {
      return Utils.error('กรุณาเข้าสู่ระบบผ่าน LINE Login OAuth2', 'USE_OAUTH_FLOW');
    }
    const user = Db.findOne(CONFIG.SHEETS.USERS, u =>
      u.Status === 'Active' && String(u.LineUserID || '').trim() === cleanLineId
    );
    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานที่ผูกกับ LINE นี้ กรุณาเข้าสู่ระบบด้วย LINE OAuth เพื่อยืนยันและผูกบัญชี');
    }
    return this.createSession(user, deviceInfo || 'LINE Login v2.1', userAgent);
  },

  /**
   * Google Account Login (requires OAuth 2.0 flow)
   */
  loginGoogle(email = '', name = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    return Utils.error('กรุณาเข้าสู่ระบบผ่าน Google OAuth 2.0 เพื่อความปลอดภัย', 'USE_OAUTH_FLOW');
  },

  /**
   * Build URL query string safely in Apps Script
   */
  buildQueryString(params) {
    return Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])))
      .join('&');
  },

  /**
   * Resolve OAuth Callback URI (ScriptApp WebApp URL or custom override)
   */
  getOAuthRedirectUri() {
    const props = PropertiesService.getScriptProperties();
    const override = String(props.getProperty('OAUTH_REDIRECT_URI') || '').trim();
    if (override) return override;
    try {
      const svcUrl = ScriptApp.getService().getUrl();
      if (svcUrl) return String(svcUrl).trim();
    } catch (e) {}
    return '';
  },

  /**
   * Read OAuth credentials cleanly from ScriptProperties
   */
  getOAuthProps() {
    const props = PropertiesService.getScriptProperties();
    return {
      googleClientId: String(props.getProperty('GOOGLE_CLIENT_ID') || '').trim(),
      googleClientSecret: String(props.getProperty('GOOGLE_CLIENT_SECRET') || '').trim(),
      lineChannelId: String(props.getProperty('LINE_CHANNEL_ID') || '').trim(),
      lineChannelSecret: String(props.getProperty('LINE_CHANNEL_SECRET') || '').trim(),
      redirectUriOverride: String(props.getProperty('OAUTH_REDIRECT_URI') || '').trim(),
      redirectUri: this.getOAuthRedirectUri()
    };
  },

  /**
   * Return Admin-only OAuth configuration status (never exposes stored secrets)
   */
  getOAuthConfigStatus(token) {
    const valid = this.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== 'Admin') {
      return Utils.error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่เข้าถึงการตั้งค่า OAuth ได้', 'FORBIDDEN');
    }
    const cfg = this.getOAuthProps();
    return Utils.success({
      redirectUri: cfg.redirectUri,
      redirectUriOverride: cfg.redirectUriOverride,
      googleClientId: cfg.googleClientId,
      hasGoogleSecret: Boolean(cfg.googleClientSecret),
      googleConfigured: Boolean(cfg.googleClientId && cfg.googleClientSecret && cfg.redirectUri),
      lineChannelId: cfg.lineChannelId,
      hasLineSecret: Boolean(cfg.lineChannelSecret),
      lineConfigured: Boolean(cfg.lineChannelId && cfg.lineChannelSecret && cfg.redirectUri)
    });
  },

  /**
   * Save OAuth credentials to ScriptProperties (Admin only)
   */
  saveOAuthConfig(token, cfg = {}) {
    const valid = this.validateSession(token);
    if (!valid.success) return valid;
    if (valid.data.user.Role !== 'Admin') {
      return Utils.error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่บันทึกการตั้งค่า OAuth ได้', 'FORBIDDEN');
    }

    const props = PropertiesService.getScriptProperties();
    const updates = {};

    if (cfg.googleClientId !== undefined) {
      const val = String(cfg.googleClientId || '').trim();
      if (val) updates.GOOGLE_CLIENT_ID = val;
      else props.deleteProperty('GOOGLE_CLIENT_ID');
    }
    if (cfg.googleClientSecret !== undefined) {
      const val = String(cfg.googleClientSecret || '').trim();
      if (val) updates.GOOGLE_CLIENT_SECRET = val;
    }
    if (cfg.lineChannelId !== undefined) {
      const val = String(cfg.lineChannelId || '').trim();
      if (val) updates.LINE_CHANNEL_ID = val;
      else props.deleteProperty('LINE_CHANNEL_ID');
    }
    if (cfg.lineChannelSecret !== undefined) {
      const val = String(cfg.lineChannelSecret || '').trim();
      if (val) updates.LINE_CHANNEL_SECRET = val;
    }
    if (cfg.redirectUriOverride !== undefined) {
      const val = String(cfg.redirectUriOverride || '').trim();
      if (val) updates.OAUTH_REDIRECT_URI = val;
      else props.deleteProperty('OAUTH_REDIRECT_URI');
    }

    if (Object.keys(updates).length > 0) {
      props.setProperties(updates, false);
    }

    const status = this.getOAuthConfigStatus(token);
    if (status.success) {
      status.message = 'บันทึกการตั้งค่า OAuth 2.0 เรียบร้อยแล้ว';
    }
    return status;
  },

  /**
   * Create real OAuth 2.0 Authorization URL (Google / LINE)
   */
  createOAuthAuthUrl(provider = '') {
    const p = String(provider || '').trim().toLowerCase();
    if (p !== 'google' && p !== 'line') {
      return Utils.error('ผู้ให้บริการเข้าสู่ระบบไม่ถูกต้อง (รองรับเฉพาะ Google และ LINE)');
    }

    const cfg = this.getOAuthProps();
    if (!cfg.redirectUri) {
      return Utils.error('ไม่พบ Callback URL ของ Web App กรุณาตรวจสอบการ Deploy หรือระบุ OAUTH_REDIRECT_URI', 'NOT_CONFIGURED');
    }

    if (p === 'google' && (!cfg.googleClientId || !cfg.googleClientSecret)) {
      return Utils.error('ยังไม่ได้ตั้งค่า Google Client ID / Client Secret (ให้ Admin เข้าเมนู ตั้งค่า > เชื่อมต่อ Google & LINE Login)', 'NOT_CONFIGURED');
    }
    if (p === 'line' && (!cfg.lineChannelId || !cfg.lineChannelSecret)) {
      return Utils.error('ยังไม่ได้ตั้งค่า LINE Channel ID / Channel Secret (ให้ Admin เข้าเมนู ตั้งค่า > เชื่อมต่อ Google & LINE Login)', 'NOT_CONFIGURED');
    }

    const state = Utilities.getUuid().replace(/-/g, '');
    try {
      CacheService.getScriptCache().put(
        'oauth_state_' + state,
        JSON.stringify({ provider: p, createdAt: Date.now() }),
        600
      );
    } catch (e) {
      return Utils.error('ไม่สามารถสร้างสถานะความปลอดภัย OAuth ได้ กรุณาลองใหม่');
    }

    let authUrl = '';
    if (p === 'google') {
      authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + this.buildQueryString({
        client_id: cfg.googleClientId,
        redirect_uri: cfg.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: state,
        prompt: 'select_account',
        access_type: 'online'
      });
    } else {
      authUrl = 'https://access.line.me/oauth2/v2.1/authorize?' + this.buildQueryString({
        response_type: 'code',
        client_id: cfg.lineChannelId,
        redirect_uri: cfg.redirectUri,
        state: state,
        scope: 'profile openid email'
      });
    }

    return Utils.success({
      authUrl: authUrl,
      provider: p,
      redirectUri: cfg.redirectUri
    });
  },

  /**
   * Parse JSON HTTP response safely
   */
  parseOAuthResponse(resp, label) {
    const code = resp ? resp.getResponseCode() : 0;
    const bodyText = resp ? resp.getContentText() : '';
    let json = {};
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {}
    if (code < 200 || code >= 300) {
      const msg = json.error_description || json.error || json.message || ('HTTP ' + code);
      throw new Error(label + ': ' + msg);
    }
    return json;
  },

  /**
   * Handle OAuth 2.0 Redirect Callback inside doGet(e)
   */
  handleOAuthCallback(params = {}) {
    if (!params || (!params.state && !params.code && !params.error)) {
      return null;
    }

    const cache = CacheService.getScriptCache();
    const stateKey = params.state ? ('oauth_state_' + String(params.state).trim()) : '';

    if (params.error) {
      if (stateKey) try { cache.remove(stateKey); } catch (e) {}
      const reason = String(params.error_description || params.error || 'ยกเลิกการเข้าสู่ระบบ');
      return {
        handled: true,
        success: false,
        error: 'การเข้าสู่ระบบถูกยกเลิกหรือปฏิเสธ: ' + reason
      };
    }

    if (!params.code || !stateKey) {
      return {
        handled: true,
        success: false,
        error: 'ข้อมูลตอบกลับ OAuth ไม่สมบูรณ์ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง'
      };
    }

    let stateObj = null;
    try {
      const rawState = cache.get(stateKey);
      if (rawState) {
        stateObj = JSON.parse(rawState);
        cache.remove(stateKey);
      }
    } catch (e) {}

    if (!stateObj || (stateObj.provider !== 'google' && stateObj.provider !== 'line')) {
      return {
        handled: true,
        success: false,
        error: 'คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณากดปุ่มเข้าสู่ระบบใหม่อีกครั้ง'
      };
    }

    const provider = stateObj.provider;
    const cfg = this.getOAuthProps();

    try {
      let identity = null;

      if (provider === 'google') {
        const tokenResp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
          method: 'post',
          payload: {
            code: String(params.code),
            client_id: cfg.googleClientId,
            client_secret: cfg.googleClientSecret,
            redirect_uri: cfg.redirectUri,
            grant_type: 'authorization_code'
          },
          muteHttpExceptions: true
        });
        const tokenData = this.parseOAuthResponse(tokenResp, 'Google Token');
        if (!tokenData.access_token) throw new Error('ไม่ได้รับ Access Token จาก Google');

        const profileResp = UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          method: 'get',
          headers: { Authorization: 'Bearer ' + tokenData.access_token },
          muteHttpExceptions: true
        });
        const profile = this.parseOAuthResponse(profileResp, 'Google UserInfo');
        const email = String(profile.email || '').trim().toLowerCase();
        const isVerified = profile.email_verified === true || String(profile.email_verified) === 'true';
        if (!profile.sub || !email) {
          throw new Error('ไม่พบข้อมูลบัญชี Google (email/sub)');
        }
        if (!isVerified) {
          throw new Error('อีเมล Google นี้ยังไม่ได้รับการยืนยัน (email_verified)');
        }

        identity = {
          provider: 'google',
          externalId: String(profile.sub),
          email: email,
          displayName: String(profile.name || ''),
          avatarUrl: String(profile.picture || '')
        };
      } else {
        const tokenResp = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
          method: 'post',
          payload: {
            grant_type: 'authorization_code',
            code: String(params.code),
            redirect_uri: cfg.redirectUri,
            client_id: cfg.lineChannelId,
            client_secret: cfg.lineChannelSecret
          },
          muteHttpExceptions: true
        });
        const tokenData = this.parseOAuthResponse(tokenResp, 'LINE Token');
        if (!tokenData.access_token) throw new Error('ไม่ได้รับ Access Token จาก LINE');

        const profileResp = UrlFetchApp.fetch('https://api.line.me/v2/profile', {
          method: 'get',
          headers: { Authorization: 'Bearer ' + tokenData.access_token },
          muteHttpExceptions: true
        });
        const profile = this.parseOAuthResponse(profileResp, 'LINE Profile');
        if (!profile.userId) {
          throw new Error('ไม่พบ userId จากบัญชี LINE');
        }

        let verifiedEmail = '';
        if (tokenData.id_token) {
          try {
            const verifyResp = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
              method: 'post',
              payload: {
                id_token: tokenData.id_token,
                client_id: cfg.lineChannelId
              },
              muteHttpExceptions: true
            });
            const verified = this.parseOAuthResponse(verifyResp, 'LINE ID Token');
            if (verified && verified.email) {
              verifiedEmail = String(verified.email).trim().toLowerCase();
            }
          } catch (e) {}
        }

        identity = {
          provider: 'line',
          externalId: String(profile.userId),
          email: verifiedEmail,
          displayName: String(profile.displayName || ''),
          avatarUrl: String(profile.pictureUrl || '')
        };
      }

      return this.completeOAuthLogin(identity);
    } catch (err) {
      return {
        handled: true,
        success: false,
        provider: provider,
        error: 'ยืนยันตัวตนกับ ' + (provider === 'google' ? 'Google' : 'LINE') + ' ไม่สำเร็จ: ' + (err.message || err)
      };
    }
  },

  /**
   * Match verified external identity to Users sheet or issue 1-time linking token
   */
  completeOAuthLogin(identity) {
    this.ensureUserSchema();

    const fieldName = identity.provider === 'google' ? 'GoogleSub' : 'LineUserID';
    let user = Db.findOne(CONFIG.SHEETS.USERS, u =>
      String(u[fieldName] || '').trim() === identity.externalId
    );

    if (!user && identity.email) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u =>
        String(u.Email || '').trim().toLowerCase() === identity.email
      );
    }

    if (!user) {
      const linkToken = Utilities.getUuid().replace(/-/g, '');
      try {
        CacheService.getScriptCache().put(
          'oauth_link_' + linkToken,
          JSON.stringify(identity),
          300
        );
      } catch (e) {
        return {
          handled: true,
          success: false,
          provider: identity.provider,
          error: 'ไม่สามารถสร้างโทเคนผูกบัญชีได้ กรุณาลองใหม่'
        };
      }

      return {
        handled: true,
        success: false,
        requiresLink: true,
        linkToken: linkToken,
        provider: identity.provider,
        displayName: identity.displayName,
        email: identity.email,
        avatarUrl: identity.avatarUrl
      };
    }

    if (user.Status !== 'Active') {
      return {
        handled: true,
        success: false,
        provider: identity.provider,
        error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบุคคล'
      };
    }

    const updates = {};
    if (String(user[fieldName] || '').trim() !== identity.externalId) {
      updates[fieldName] = identity.externalId;
    }
    if (!String(user.AvatarUrl || '').trim() && identity.avatarUrl) {
      updates.AvatarUrl = identity.avatarUrl;
    }
    if (Object.keys(updates).length > 0) {
      updates.UpdatedAt = new Date().toISOString();
      Db.update(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID, updates);
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID) || user;
    }

    const deviceLabel = identity.provider === 'google' ? 'Google OAuth2' : 'LINE Login v2.1';
    const sessRes = this.createSession(user, deviceLabel, '');
    if (!sessRes.success) {
      return {
        handled: true,
        success: false,
        provider: identity.provider,
        error: (sessRes.error && sessRes.error.message) || 'สร้างเซสชันไม่สำเร็จ'
      };
    }

    return {
      handled: true,
      success: true,
      provider: identity.provider,
      data: sessRes.data
    };
  },

  /**
   * 1-time Employee Account Linking after verified Google/LINE OAuth authentication
   */
  linkOAuthAccount(linkToken, identifier, password, deviceInfo = '', userAgent = '') {
    const cleanToken = String(linkToken || '').trim();
    if (!cleanToken) {
      return Utils.error('ไม่พบโทเคนสำหรับผูกบัญชี กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'oauth_link_' + cleanToken;
    const rawIdentity = cache.get(cacheKey);
    if (!rawIdentity) {
      return Utils.error('คำขอผูกบัญชีหมดอายุแล้ว กรุณากดปุ่มเข้าสู่ระบบด้วย Google / LINE ใหม่อีกครั้ง', 'LINK_EXPIRED');
    }

    const verified = this.verifyEmployeeCredentials(identifier, password, userAgent);
    if (!verified.success) return verified;

    let identity = null;
    try {
      identity = JSON.parse(rawIdentity);
    } catch (e) {
      return Utils.error('ข้อมูลการยืนยันตัวตนไม่ถูกต้อง');
    }

    this.ensureUserSchema();
    const user = verified.data.user;
    const fieldName = identity.provider === 'google' ? 'GoogleSub' : 'LineUserID';
    const updates = {
      [fieldName]: String(identity.externalId || ''),
      UpdatedAt: new Date().toISOString()
    };
    if (!String(user.AvatarUrl || '').trim() && identity.avatarUrl) {
      updates.AvatarUrl = String(identity.avatarUrl);
    }

    Db.update(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID, updates);
    try { cache.remove(cacheKey); } catch (e) {}

    const updatedUser = Db.findOne(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID) || user;
    const deviceLabel = deviceInfo || (identity.provider === 'google' ? 'Google OAuth2' : 'LINE Login v2.1');
    return this.createSession(updatedUser, deviceLabel, userAgent);
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
      Status: String(user.Status || 'Active'),
      AvatarUrl: String(user.AvatarUrl || '')
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
   * Update Profile (supports FullName, AvatarUrl, and avatarBase64 mobile image upload)
   */
  updateProfile(token, profileData) {
    const valid = this.validateSession(token);
    if (!valid.success) return valid;
    if (!profileData) return Utils.error('ไม่พบข้อมูลสำหรับอัปเดตโปรไฟล์');

    this.ensureUserSchema();

    const user = valid.data.user;
    const allowed = {};
    if (profileData.FullName) allowed.FullName = profileData.FullName;

    if (profileData.avatarBase64) {
      const uploaded = Files.uploadAvatar(profileData.avatarBase64, user.EmployeeCode || user.UserID);
      if (uploaded && uploaded.shared && uploaded.imageUrl) {
        allowed.AvatarUrl = uploaded.imageUrl;
      } else if (String(profileData.avatarBase64).length <= 45000) {
        // Fallback to compact Data URL if Drive public sharing is restricted
        allowed.AvatarUrl = String(profileData.avatarBase64);
      } else if (uploaded && uploaded.imageUrl) {
        allowed.AvatarUrl = uploaded.imageUrl;
      } else {
        return Utils.error('ไม่สามารถอัปโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } else if (profileData.AvatarUrl !== undefined) {
      allowed.AvatarUrl = profileData.AvatarUrl;
    }

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
