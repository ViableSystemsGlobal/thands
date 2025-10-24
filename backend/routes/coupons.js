const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/coupons - Get all coupons (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const result = await query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons', details: error.message });
  }
});

// GET /api/coupons/validate/:code - Validate coupon code (Public)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 
       AND is_active = true 
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    res.json(coupon);
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon', details: error.message });
  }
});

// POST /api/coupons/validate - Validate coupon code (Public)
router.post('/validate', [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('order_total').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, order_total } = req.body;

    const result = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 
       AND is_active = true 
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ valid: false, error: 'Coupon usage limit reached' });
    }

    // Check minimum order value
    if (coupon.min_order_value && order_total < coupon.min_order_value) {
      return res.status(400).json({ 
        valid: false, 
        error: `Minimum order value of $${coupon.min_order_value} required` 
      });
    }

    res.json({ 
      valid: true, 
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon', details: error.message });
  }
});

// POST /api/coupons - Create coupon (Admin only)
router.post('/', authenticateToken, [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discount_type').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discount_value').isFloat({ min: 0 }).withMessage('Valid discount value is required'),
  body('description').optional().trim(),
  body('min_order_value').optional().isFloat({ min: 0 }),
  body('max_discount_amount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('valid_from').optional().isISO8601(),
  body('valid_until').optional().isISO8601(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      discount_type,
      discount_value,
      description,
      min_order_value,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until,
      is_active = true
    } = req.body;

    const result = await query(
      `INSERT INTO coupons (
        code, discount_type, discount_value, description, min_order_value,
        max_discount_amount, usage_limit, valid_from, valid_until, is_active,
        usage_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, NOW())
      RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        description || null,
        min_order_value || null,
        max_discount_amount || null,
        usage_limit || null,
        valid_from || null,
        valid_until || null,
        is_active
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating coupon:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create coupon', details: error.message });
  }
});

// PUT /api/coupons/:id - Update coupon (Admin only)
router.put('/:id', authenticateToken, [
  body('code').optional().trim(),
  body('discount_type').optional().isIn(['percentage', 'fixed']),
  body('discount_value').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('min_order_value').optional().isFloat({ min: 0 }),
  body('max_discount_amount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('valid_from').optional().isISO8601(),
  body('valid_until').optional().isISO8601(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Build update query dynamically
    const allowedFields = [
      'code', 'discount_type', 'discount_value', 'description',
      'min_order_value', 'max_discount_amount', 'usage_limit',
      'valid_from', 'valid_until', 'is_active'
    ];
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(key === 'code' ? updates[key].toUpperCase() : updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await query(
      `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating coupon:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update coupon', details: error.message });
  }
});

// DELETE /api/coupons/:id - Delete coupon (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM coupons WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon', details: error.message });
  }
});

module.exports = router;

