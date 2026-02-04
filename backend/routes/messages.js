const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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
