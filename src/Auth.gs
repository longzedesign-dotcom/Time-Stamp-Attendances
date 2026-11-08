/**
 * File: Auth.gs
 * Description: User Authentication, MOC Account SSO, ThaID Simulation, and Session Management.
 */

const Auth = {
  /**
   * Login with Member ID / Employee Code or Email
   */
  loginMember(identifier, password, deviceInfo = '', userAgent = '') {
    if (!identifier || !password) {
      return Utils.error('กรุณาระบุรหัสพนักงาน/อีเมล และรหัสผ่าน');
    }

    const clean = String(identifier).trim().toLowerCase();
    const user = Db.findOne(CONFIG.SHEETS.USERS, u => 
      String(u.Email).toLowerCase() === clean || 
      String(u.EmployeeCode).toLowerCase() === clean ||
      String(u.UserID).toLowerCase() === clean
    );

    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานในระบบ');
    }

    if (user.Status !== 'Active') {
      return Utils.error('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบุคคล');
    }

    const inputHash = Utils.hashPassword(password);
    if (user.PasswordHash && user.PasswordHash !== inputHash) {
      return Utils.error('รหัสผ่านไม่ถูกต้อง');
    }

    return this.createSession(user, deviceInfo, userAgent);
  },

  /**
   * Login with LINE Account
   */
  loginLINE(lineId = '', displayName = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    let user = null;
    if (lineId) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.EmployeeCode) === String(lineId));
    }
    if (!user) {
      // Find active user or match default
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.Status === 'Active');
    }
    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานที่เชื่อมต่อกับ LINE');
    }

    return this.createSession(user, deviceInfo || 'LINE Mobile App', userAgent);
  },

  /**
   * Login with Google Account
   */
  loginGoogle(email = '', name = '', pictureUrl = '', deviceInfo = '', userAgent = '') {
    let user = null;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.Email).toLowerCase() === cleanEmail);
    }
    if (!user) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.Status === 'Active');
    }
    if (!user) {
      return Utils.error('ไม่พบบัญชีพนักงานที่เชื่อมต่อกับ Google Account นี้');
    }

    return this.createSession(user, deviceInfo || 'Google Workspace SSO', userAgent);
  },

  /**
   * MOC Account Login (Single Sign-On for Ministry of Commerce)
   */
  loginMOC(email, deviceInfo = '', userAgent = '') {
    if (!email) {
      return Utils.error('กรุณาระบุ MOC Account Email');
    }
    const cleanEmail = String(email).trim().toLowerCase();
    let user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.Email).toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-provision if authorized domain or create user
      const newUserId = 'U' + String(Date.now()).slice(-4);
      user = {
        UserID: newUserId,
        EmployeeCode: 'MOC' + newUserId,
        FullName: 'ผู้ใช้งานกระทรวงพาณิชย์ (' + cleanEmail.split('@')[0] + ')',
        Email: cleanEmail,
        PasswordHash: '',
        Position: 'เจ้าหน้าที่',
        DepartmentID: 'IT',
        WorkStart: '08:30',
        WorkEnd: '16:30',
        Role: CONFIG.ROLES.USER,
        Status: 'Active',
        AvatarUrl: '',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };
      Db.insert(CONFIG.SHEETS.USERS, user);
    }

    return this.createSession(user, deviceInfo, userAgent);
  },

  /**
   * ThaID Digital Identity Login Simulation
   */
  loginThaID(idCardNo = '', fullName = '', deviceInfo = '', userAgent = '') {
    // If user with this ID or demo user exists
    let user = null;
    if (idCardNo) {
      user = Db.findOne(CONFIG.SHEETS.USERS, u => String(u.EmployeeCode) === String(idCardNo));
    }
    if (!user) {
      // Use primary active user (e.g. คุณ เฉลิมพร ถาโคตร) or create
      user = Db.findOne(CONFIG.SHEETS.USERS, u => u.Status === 'Active');
    }

    if (!user) {
      return Utils.error('ไม่สามารถยืนยันตัวตนด้วย ThaID ได้');
    }

    return this.createSession(user, deviceInfo || 'ThaID Verified Mobile', userAgent);
  },

  /**
   * Create Session and issue Session Token
   */
  createSession(user, deviceInfo = '', userAgent = '') {
    const token = Utils.generateToken();
    const loginAt = new Date();
    const expireAt = new Date(loginAt.getTime() + CONFIG.SECURITY.SESSION_HOURS * 3600 * 1000);

    const sessionObj = {
      SessionID: 'SES' + Date.now(),
      UserID: user.UserID,
      Token: token,
      LoginAt: loginAt.toISOString(),
      ExpireAt: expireAt.toISOString(),
      DeviceInfo: deviceInfo,
      UserAgent: userAgent,
      Status: 'Active'
    };

    Db.insert(CONFIG.SHEETS.SESSIONS, sessionObj);

    // Audit log
    Db.insert(CONFIG.SHEETS.AUDIT_LOGS, {
      LogID: 'LOG' + Date.now(),
      UserID: user.UserID,
      Action: 'LOGIN',
      Detail: `User logged in from ${deviceInfo}`,
      IPAddress: '',
      UserAgent: userAgent,
      CreatedAt: new Date().toISOString()
    });

    const safeUser = Object.assign({}, user);
    delete safeUser.PasswordHash;

    return Utils.success({
      token: token,
      user: safeUser,
      expireAt: expireAt.toISOString()
    }, 'เข้าสู่ระบบสำเร็จ');
  },

  /**
   * Validate Session Token and return User
   */
  validateSession(token) {
    if (!token) {
      return Utils.error('Token ไม่ถูกต้อง', 'UNAUTHORIZED');
    }

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

    return Utils.success({ user: safeUser, session: session });
  },

  /**
   * Logout user and revoke session
   */
  logout(token) {
    if (!token) return Utils.success({}, 'ออกจากระบบแล้ว');
    Db.update(CONFIG.SHEETS.SESSIONS, s => s.Token === token, { Status: 'Revoked' });
    return Utils.success({}, 'ออกจากระบบเรียบร้อยแล้ว');
  },

  /**
   * Update Profile Details
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

    const updated = Db.findOne(CONFIG.SHEETS.USERS, u => u.UserID === user.UserID);
    delete updated.PasswordHash;
    return Utils.success({ user: updated }, 'อัปเดตข้อมูลส่วนตัวสำเร็จ');
  }
};
