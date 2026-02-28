const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// ─── Helper: build nodemailer transporter from DB email settings ───────────────
async function getTransporter() {
  const result = await query('SELECT * FROM email_settings WHERE id = 1');
  if (result.rows.length === 0) throw new Error('Email settings not configured');
  const s = result.rows[0];
  return {
    transporter: nodemailer.createTransport({
      host:   s.smtp_host,
      port:   s.smtp_port,
      secure: s.smtp_secure,
      auth:   { user: s.smtp_username, pass: s.smtp_password }
    }),
    from: `"${s.smtp_from_name}" <${s.smtp_from_email}>`
  };
}

// GET /api/messages - Get all messages (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      page = 1,
      limit = 20,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let queryText = 'SELECT * FROM messages WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(queryText.replace('SELECT *', 'SELECT COUNT(*)'), queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      messages: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// POST /api/messages - Create message (Public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    const result = await query(
      `INSERT INTO messages (name, email, subject, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [name, email, subject, message, 'new']
    );

    const newMessage = result.rows[0];

    // Send admin notification for new message
    try {
      const adminNotificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/admin/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: newMessage.id
        })
      });

      if (adminNotificationResponse.ok) {
        console.log('📧 Admin message notification sent');
      } else {
        console.error('❌ Failed to send admin message notification');
      }
    } catch (adminNotificationError) {
      console.error('❌ Error sending admin message notification:', adminNotificationError);
      // Don't fail the message creation if admin notification fails
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message', details: error.message });
  }
});

// PUT /api/messages/:id - Update message status (Admin only)
router.put('/:id', authenticateToken, [
  body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      'UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message', details: error.message });
  }
});

// GET /api/messages/:id/replies - Get reply thread for a message (Admin only)
router.get('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await query(
      `SELECT r.*, u.full_name AS sent_by_name
       FROM message_replies r
       LEFT JOIN users u ON u.id = r.sent_by
       WHERE r.message_id = $1
       ORDER BY r.sent_at ASC`,
      [id]
    );

    res.json({ replies: result.rows });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies', details: error.message });
  }
});

// POST /api/messages/:id/reply - Send reply email and store it (Admin only)
router.post('/:id/reply', authenticateToken, [
  body('reply_body').trim().notEmpty().withMessage('Reply body is required')
], async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reply_body } = req.body;

    // Fetch original message
    const msgResult = await query('SELECT * FROM messages WHERE id = $1', [id]);
    if (msgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const original = msgResult.rows[0];

    // Build and send email
    const { transporter, from } = await getTransporter();

    const replySubject = original.subject.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="padding: 24px; background: #fff;">
          <p style="white-space: pre-wrap; font-size: 15px; color: #1a1a1a;">${reply_body.replace(/\n/g, '<br>')}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <div style="padding: 16px; background: #f9fafb; border-radius: 6px; color: #6b7280; font-size: 13px;">
          <p style="margin: 0 0 6px;"><strong>Original message from ${original.name}:</strong></p>
          <p style="margin: 0 0 4px;"><strong>Subject:</strong> ${original.subject}</p>
          <p style="margin: 0 0 4px;"><strong>Date:</strong> ${new Date(original.created_at).toLocaleString()}</p>
          <p style="margin: 12px 0 0; white-space: pre-wrap;">${original.message.replace(/\n/g, '<br>')}</p>
        </div>
      </div>`;

    await transporter.sendMail({
      from,
      to:      `"${original.name}" <${original.email}>`,
      subject: replySubject,
      html:    htmlBody,
      replyTo: from
    });

    // Save reply to DB
    const replyResult = await query(
      `INSERT INTO message_replies (message_id, reply_body, sent_by, sent_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [id, reply_body, req.user.id]
    );

    // Mark original message as replied
    await query(
      'UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2',
      ['replied', id]
    );

    console.log(`✅ Reply sent to ${original.email} for message #${id}`);
    res.json({
      success: true,
      reply: replyResult.rows[0],
      message: `Reply sent to ${original.email}`
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply', details: error.message });
  }
});

// DELETE /api/messages/:id - Delete message (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM messages WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message', details: error.message });
  }
});

module.exports = router;
