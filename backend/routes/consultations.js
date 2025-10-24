const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/consultations/metrics - Get consultation metrics (Admin only) - MUST BE BEFORE /:id
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const metricsResult = await query(`
      SELECT 
        COUNT(*) as total_consultations,
        COUNT(*) FILTER (WHERE type = 'design') as design_consultations,
        COUNT(*) FILTER (WHERE type = 'booking') as booking_consultations,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_consultations,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_consultations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_consultations,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_consultations
      FROM consultations
    `);

    res.json(metricsResult.rows[0]);
  } catch (error) {
    console.error('Error fetching consultation metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
});

// GET /api/consultations - Get all consultations (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      page = 1,
      limit = 20,
      type,
      status,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let queryText = 'SELECT * FROM consultations WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
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
      consultations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations', details: error.message });
  }
});

// GET /api/consultations/:id - Get single consultation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await query(
      'SELECT * FROM consultations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ error: 'Failed to fetch consultation', details: error.message });
  }
});

// POST /api/consultations - Create consultation (Public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('type').isIn(['design', 'booking']).withMessage('Type must be design or booking'),
  body('consultation_type').optional().trim(),
  body('preferred_date').optional().isISO8601(),
  body('preferred_time').optional().trim(),
  body('height').optional().trim(),
  body('sizes').optional(),
  body('additional_instructions').optional().trim(),
  body('consultation_instructions').optional().trim(),
  body('design_urls').optional().isArray(),
  body('photo_urls').optional().isArray(),
  body('measurements_url').optional().trim(),
  body('inspiration_url').optional().trim(),
  body('photo_url').optional().trim(),
  body('recaptcha_token').optional().trim(),
  body('session_id').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      type,
      consultation_type,
      preferred_date,
      preferred_time,
      height,
      sizes,
      additional_instructions,
      consultation_instructions,
      design_urls,
      photo_urls,
      measurements_url,
      inspiration_url,
      photo_url,
      recaptcha_token,
      session_id
    } = req.body;

    const result = await query(
      `INSERT INTO consultations (
        name, email, phone, type, consultation_type, preferred_date, preferred_time,
        height, sizes, additional_instructions, consultation_instructions,
        design_urls, photo_urls, measurements_url, inspiration_url, photo_url,
        recaptcha_token, session_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
      RETURNING *`,
      [
        name,
        email,
        phone || null,
        type,
        consultation_type || null,
        preferred_date || null,
        preferred_time || null,
        height || null,
        sizes ? JSON.stringify(sizes) : null,
        additional_instructions || null,
        consultation_instructions || null,
        design_urls ? JSON.stringify(design_urls) : null,
        photo_urls ? JSON.stringify(photo_urls) : null,
        measurements_url || null,
        inspiration_url || null,
        photo_url || null,
        recaptcha_token || null,
        session_id || null,
        'pending'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation', details: error.message });
  }
});

// PUT /api/consultations/:id - Update consultation (Admin only)
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled'])
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
    const updates = req.body;

    // Build update query dynamically
    const allowedFields = ['status', 'preferred_date', 'preferred_time', 'consultation_instructions'];
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
    updateValues.push(id);

    const result = await query(
      `UPDATE consultations SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ error: 'Failed to update consultation', details: error.message });
  }
});

// DELETE /api/consultations/:id - Delete consultation (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM consultations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({ message: 'Consultation deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    res.status(500).json({ error: 'Failed to delete consultation', details: error.message });
  }
});

module.exports = router;
