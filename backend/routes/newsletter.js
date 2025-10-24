const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/newsletter/subscribers - Get all subscribers (Admin only)
router.get('/subscribers', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      page = 1,
      limit = 20,
      is_active
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let queryText = 'SELECT * FROM newsletter_subscribers WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    // Get total count
    const countResult = await query(queryText.replace('SELECT *', 'SELECT COUNT(*)'), queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    queryText += ` ORDER BY subscribed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      subscribers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers', details: error.message });
  }
});

// GET /api/newsletter/stats - Get newsletter statistics (Admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '30 days') as recent_subscribers,
        COUNT(*) FILTER (WHERE is_active = false) as unsubscribed_count
      FROM newsletter_subscribers
    `);

    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// GET /api/newsletter/settings - Get newsletter settings (Admin only)
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query(
      'SELECT * FROM newsletter_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        id: 1,
        title: 'Get 15% Off Your First Order!',
        subtitle: 'Join our newsletter for exclusive offers',
        description: 'Be the first to know about new arrivals, special promotions, and styling tips.',
        offer_text: 'Use code WELCOME15 at checkout',
        button_text: 'Claim Your Discount',
        image_url: '',
        is_enabled: true
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching newsletter settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

// POST /api/newsletter/subscribe - Subscribe to newsletter (Public)
router.post('/subscribe', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('source').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, source = 'popup' } = req.body;

    // Check if already subscribed
    const existingResult = await query(
      'SELECT * FROM newsletter_subscribers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      if (existing.is_active) {
        return res.status(400).json({ error: 'Email already subscribed' });
      }
      
      // Reactivate if previously unsubscribed
      await query(
        'UPDATE newsletter_subscribers SET is_active = true, subscribed_at = NOW() WHERE email = $1',
        [email.toLowerCase()]
      );
      
      return res.json({ message: 'Successfully resubscribed to newsletter' });
    }

    const result = await query(
      `INSERT INTO newsletter_subscribers (email, source, is_active, subscribed_at)
       VALUES ($1, $2, true, NOW())
       RETURNING *`,
      [email.toLowerCase(), source]
    );

    res.status(201).json({ message: 'Successfully subscribed to newsletter', subscriber: result.rows[0] });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Failed to subscribe', details: error.message });
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter (Public)
router.post('/unsubscribe', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const result = await query(
      'UPDATE newsletter_subscribers SET is_active = false WHERE email = $1 RETURNING *',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found in newsletter' });
    }

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Failed to unsubscribe', details: error.message });
  }
});

// PUT /api/newsletter/settings - Update newsletter settings (Admin only)
router.put('/settings', authenticateToken, [
  body('title').optional().trim(),
  body('subtitle').optional().trim(),
  body('description').optional().trim(),
  body('offer_text').optional().trim(),
  body('button_text').optional().trim(),
  body('image_url').optional().trim(),
  body('is_enabled').optional().isBoolean()
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

    const updates = req.body;

    // Build update query dynamically
    const allowedFields = ['title', 'subtitle', 'description', 'offer_text', 'button_text', 'image_url', 'is_enabled'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);

    // Try to update existing settings
    let result = await query(
      `UPDATE newsletter_settings SET ${updateFields.join(', ')} WHERE id = 1 RETURNING *`,
      updateValues
    );

    // If no settings exist, create them
    if (result.rows.length === 0) {
      const insertFields = Object.keys(updates).filter(k => allowedFields.includes(k));
      const insertValues = insertFields.map(k => updates[k]);
      
      result = await query(
        `INSERT INTO newsletter_settings (id, ${insertFields.join(', ')}, created_at)
         VALUES (1, ${insertFields.map((_, i) => `$${i + 1}`).join(', ')}, NOW())
         RETURNING *`,
        insertValues
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating newsletter settings:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

module.exports = router;
