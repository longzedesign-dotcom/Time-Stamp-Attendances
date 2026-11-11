/**
 * File: Chat.gs
 * Description: Internal Messaging, FAQ Knowledge Base, and HR Support Tickets.
 */

const Chat = {
  CACHE_TTL_SECONDS: 300,
  CACHE_MAX_MESSAGES: 100,

  getChannelCacheKey(channelId = 'GENERAL') {
    return 'chat_v1_' + String(channelId || 'GENERAL').replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  sortMessages(messages) {
    return messages.sort((a, b) => {
      const tDiff = new Date(a.CreatedAt) - new Date(b.CreatedAt);
      if (!isNaN(tDiff) && tDiff !== 0) return tDiff;
      return String(a.MessageID || '').localeCompare(String(b.MessageID || ''));
    });
  },

  readCachedChannel(channelId = 'GENERAL') {
    try {
      const raw = CacheService.getScriptCache().get(this.getChannelCacheKey(channelId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  writeCachedChannel(channelId = 'GENERAL', messages = []) {
    try {
      const recent = messages.slice(-this.CACHE_MAX_MESSAGES);
      const lastMessageId = recent.length > 0 ? String(recent[recent.length - 1].MessageID || '') : '';
      const payload = JSON.stringify({ lastMessageId: lastMessageId, messages: recent });
      if (payload.length < 95000) {
        CacheService.getScriptCache().put(this.getChannelCacheKey(channelId), payload, this.CACHE_TTL_SECONDS);
      }
    } catch (e) { /* ignore cache write error */ }
  },

  /**
   * Get Messages for a channel (supports CacheService & incremental delta sync via afterMessageId)
   */
  getMessages(token, channelId = 'GENERAL', afterMessageId = '') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    const cleanAfterId = String(afterMessageId || '').trim();
    const cached = this.readCachedChannel(channelId);
    if (cached && Array.isArray(cached.messages)) {
      if (cleanAfterId && cleanAfterId === String(cached.lastMessageId || '')) {
        return Utils.success({
          messages: [],
          unchanged: true,
          incremental: true,
          lastMessageId: cached.lastMessageId || ''
        });
      }
      if (cleanAfterId) {
        const idx = cached.messages.findIndex(m => String(m.MessageID) === cleanAfterId);
        if (idx !== -1) {
          return Utils.success({
            messages: cached.messages.slice(idx + 1),
            unchanged: false,
            incremental: true,
            lastMessageId: cached.lastMessageId || ''
          });
        }
      } else {
        return Utils.success({
          messages: cached.messages,
          unchanged: false,
          incremental: false,
          lastMessageId: cached.lastMessageId || ''
        });
      }
    }

    let messages = Db.find(CONFIG.SHEETS.CHAT_MESSAGES, m => m.ChannelID === channelId);
    this.sortMessages(messages);
    this.writeCachedChannel(channelId, messages);

    const lastMessageId = messages.length > 0 ? String(messages[messages.length - 1].MessageID || '') : '';
    if (cleanAfterId) {
      const idx = messages.findIndex(m => String(m.MessageID) === cleanAfterId);
      if (idx !== -1) {
        return Utils.success({
          messages: messages.slice(idx + 1),
          unchanged: idx === messages.length - 1,
          incremental: true,
          lastMessageId: lastMessageId
        });
      }
    }

    return Utils.success({
      messages: messages,
      unchanged: false,
      incremental: false,
      lastMessageId: lastMessageId
    });
  },

  /**
   * Send Message in channel (updates ScriptCache immediately for fast polling)
   */
  sendMessage(token, channelId = 'GENERAL', content = '', attachmentUrl = '') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (!content.trim() && !attachmentUrl) {
      return Utils.error('กรุณาระบุข้อความ');
    }

    const msgObj = {
      MessageID: 'MSG' + Date.now(),
      ChannelID: channelId,
      SenderID: user.UserID,
      SenderName: user.FullName,
      Content: content.trim(),
      AttachmentUrl: attachmentUrl,
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.CHAT_MESSAGES, msgObj);

    const cached = this.readCachedChannel(channelId);
    if (cached && Array.isArray(cached.messages)) {
      cached.messages.push(msgObj);
      this.writeCachedChannel(channelId, cached.messages);
    } else {
      const all = this.sortMessages(Db.find(CONFIG.SHEETS.CHAT_MESSAGES, m => m.ChannelID === channelId));
      this.writeCachedChannel(channelId, all);
    }

    return Utils.success({ message: msgObj });
  },

  /**
   * Get FAQs
   */
  getFAQs(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    const faqs = Db.find(CONFIG.SHEETS.FAQ_ITEMS, f => f.Status === 'Active');
    faqs.sort((a, b) => (Number(a.OrderNum) || 0) - (Number(b.OrderNum) || 0));

    return Utils.success({ faqs: faqs });
  },

  /**
   * Create HR Support Ticket
   */
  createTicket(token, data) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    if (!data.subject || !data.details) {
      return Utils.error('กรุณาระบุหัวข้อและรายละเอียดเคส');
    }

    const ticket = {
      TicketID: 'TCK' + Date.now(),
      UserID: user.UserID,
      FullName: user.FullName,
      Category: data.category || 'ทั่วไป',
      Subject: data.subject,
      Details: data.details,
      Status: 'Open',
      Response: '',
      ResolvedAt: '',
      CreatedAt: new Date().toISOString()
    };

    Db.insert(CONFIG.SHEETS.HR_TICKETS, ticket);
    Notify.sendInApp(user.UserID, 'เปิดเคสสอบถาม HR แล้ว', `เคส #${ticket.TicketID} ถูกส่งถึงฝ่ายบุคคลเรียบร้อยแล้ว`, 'TICKET');

    return Utils.success({ ticket: ticket }, 'เปิดเคสสอบถามเรียบร้อยแล้ว');
  },

  /**
   * Get User HR Tickets
   */
  getTickets(token) {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;
    const user = valid.data.user;

    let tickets;
    if (user.Role === CONFIG.ROLES.ADMIN) {
      tickets = Db.getAll(CONFIG.SHEETS.HR_TICKETS);
    } else {
      tickets = Db.find(CONFIG.SHEETS.HR_TICKETS, t => t.UserID === user.UserID);
    }

    return Utils.success({ tickets: tickets });
  }
};
