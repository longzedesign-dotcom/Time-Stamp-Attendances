/**
 * File: Chat.gs
 * Description: Internal Messaging, FAQ Knowledge Base, and HR Support Tickets.
 */

const Chat = {
  /**
   * Get Messages for a channel
   */
  getMessages(token, channelId = 'GENERAL') {
    const valid = Auth.validateSession(token);
    if (!valid.success) return valid;

    let messages = Db.find(CONFIG.SHEETS.CHAT_MESSAGES, m => m.ChannelID === channelId);
    messages.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));

    return Utils.success({ messages: messages });
  },

  /**
   * Send Message in channel
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
