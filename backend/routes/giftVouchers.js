const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/gift-vouchers/validate/:code - Validate gift voucher code (Public)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await query(
      `SELECT gv.*, gvt.name as type_name, gvt.amount as type_amount
       FROM gift_vouchers gv
       LEFT JOIN gift_voucher_types gvt ON gv.gift_voucher_type_id = gvt.id
       WHERE gv.voucher_code = $1 
       AND gv.is_redeemed = false
       AND (gv.expiry_date IS NULL OR gv.expiry_date >= NOW())`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired gift voucher code' });
    }

    const voucher = result.rows[0];
    
    // Format response
    res.json({
      ...voucher,
      code: voucher.voucher_code,
      amount: voucher.type_amount,
      gift_voucher_types: {
        name: voucher.type_name,
        amount: voucher.type_amount
      }
    });
  } catch (error) {
    console.error('Error validating gift voucher:', error);
    res.status(500).json({ error: 'Failed to validate gift voucher', details: error.message });
  }
});

// GET /api/gift-vouchers/types/:id - Get single gift voucher type (Public)
router.get('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM gift_voucher_types WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift voucher type not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching gift voucher type:', error);
    res.status(500).json({ error: 'Failed to fetch gift voucher type', details: error.message });
  }
});

// GET /api/gift-vouchers/types - Get all gift voucher types (Public)
router.get('/types', async (req, res) => {
  try {
    const { is_active } = req.query;

    let queryText = 'SELECT * FROM gift_voucher_types WHERE 1=1';
    const queryParams = [];

    if (is_active !== undefined) {
      queryText += ' AND is_active = $1';
      queryParams.push(is_active === 'true');
    }

    queryText += ' ORDER BY amount ASC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gift voucher types:', error);
    res.status(500).json({ error: 'Failed to fetch gift voucher types', details: error.message });
  }
});

// POST /api/gift-vouchers/types - Create gift voucher type (Admin only)
router.post('/types', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('description').optional().trim(),
  body('validity_months').optional().isInt({ min: 1 }),
  body('image_url').optional().trim(),
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
      name,
      amount,
      description,
      validity_months = 12,
      image_url,
      is_active = true
    } = req.body;

    const result = await query(
      `INSERT INTO gift_voucher_types (
        name, amount, description, validity_months, image_url, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [name, amount, description || null, validity_months, image_url || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating gift voucher type:', error);
    res.status(500).json({ error: 'Failed to create gift voucher type', details: error.message });
  }
});

// PUT /api/gift-vouchers/types/:id - Update gift voucher type (Admin only)
router.put('/types/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { id } = req.params;
    const updates = req.body;

    // Build update query dynamically
    const allowedFields = ['name', 'amount', 'description', 'validity_months', 'image_url', 'is_active'];
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
      `UPDATE gift_voucher_types SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift voucher type not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating gift voucher type:', error);
    res.status(500).json({ error: 'Failed to update gift voucher type', details: error.message });
  }
});

// DELETE /api/gift-vouchers/types/:id - Delete gift voucher type (Admin only)
router.delete('/types/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM gift_voucher_types WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift voucher type not found' });
    }

    res.json({ message: 'Gift voucher type deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting gift voucher type:', error);
    res.status(500).json({ error: 'Failed to delete gift voucher type', details: error.message });
  }
});

// GET /api/gift-vouchers - Get all issued gift vouchers (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const {
      page = 1,
      limit = 20,
      status,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query - match actual schema
    let queryText = `
      SELECT gv.*, gvt.name as type_name, gvt.amount as type_amount
      FROM gift_vouchers gv
      LEFT JOIN gift_voucher_types gvt ON gv.gift_voucher_type_id = gvt.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Note: The gift_vouchers table has is_redeemed instead of status
    // Map 'active' -> false, 'used' -> true
    if (status && status !== 'all') {
      if (status === 'used') {
        queryText += ` AND gv.is_redeemed = true`;
      } else if (status === 'active') {
        queryText += ` AND gv.is_redeemed = false`;
      }
    }

    if (search) {
      queryText += ` AND (
        gv.voucher_code ILIKE $${paramIndex} OR 
        gv.issued_to_email ILIKE $${paramIndex} OR 
        gv.issued_to_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      queryText.replace('SELECT gv.*, gvt.name as type_name, gvt.amount as type_amount', 'SELECT COUNT(*)'),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results - use created_at instead of purchased_at
    queryText += ` ORDER BY gv.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Format response to match expected structure
    const vouchers = result.rows.map(voucher => ({
      ...voucher,
      // Map schema fields to expected frontend format
      code: voucher.voucher_code,
      recipient_email: voucher.issued_to_email,
      recipient_name: voucher.issued_to_name,
      status: voucher.is_redeemed ? 'used' : 'active',
      purchased_at: voucher.created_at,
      gift_voucher_types: {
        name: voucher.type_name,
        amount: voucher.type_amount
      }
    }));

    res.json({
      vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching gift vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch gift vouchers', details: error.message });
  }
});

// PUT /api/gift-vouchers/:id/status - Update gift voucher status (Admin only)
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['active', 'used', 'expired', 'cancelled']).withMessage('Invalid status')
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
    const { status } = req.body;

    // Map status to is_redeemed field
    const isRedeemed = status === 'used';
    const redeemedAt = status === 'used' ? 'NOW()' : 'NULL';

    const result = await query(
      `UPDATE gift_vouchers 
       SET is_redeemed = $1, redeemed_at = ${redeemedAt}, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [isRedeemed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift voucher not found' });
    }

    // Return with mapped fields
    const voucher = result.rows[0];
    res.json({
      ...voucher,
      code: voucher.voucher_code,
      recipient_email: voucher.issued_to_email,
      recipient_name: voucher.issued_to_name,
      status: voucher.is_redeemed ? 'used' : 'active',
      purchased_at: voucher.created_at
    });
  } catch (error) {
    console.error('Error updating gift voucher status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

// DELETE /api/gift-vouchers/:id - Delete gift voucher (Admin only)
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
      'DELETE FROM gift_vouchers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift voucher not found' });
    }

    res.json({ message: 'Gift voucher deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting gift voucher:', error);
    res.status(500).json({ error: 'Failed to delete gift voucher', details: error.message });
  }
});

module.exports = router;

