const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get all shipping rules (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query(
      'SELECT * FROM shipping_rules ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules' });
  }
});

// Get active shipping rules (Public endpoint)
router.get('/active', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM shipping_rules WHERE is_active = true ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active shipping rules:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules' });
  }
});

// Create shipping rule (Admin only)
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Rule name is required'),
  body('shipping_cost').isFloat({ min: 0 }).withMessage('Valid shipping cost is required')
], async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      country,
      state,
      min_order_value = 0,
      max_order_value,
      shipping_cost,
      free_shipping_threshold,
      estimated_days_min,
      estimated_days_max,
      is_active = true
    } = req.body;

    const result = await query(
      `INSERT INTO shipping_rules (name, country, state, min_order_value, max_order_value, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, country, state, min_order_value, max_order_value, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    res.status(500).json({ error: 'Failed to create shipping rule', details: error.message });
  }
});

// Update shipping rule (Admin only)
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Rule name cannot be empty'),
  body('shipping_cost').optional().isFloat({ min: 0 }).withMessage('Valid shipping cost is required')
], async (req, res) => {
  try {
    // Check if user is admin
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
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length > 0) {
      paramCount++;
      updateFields.push('updated_at = NOW()');
      values.push(id);

      const updateSql = `UPDATE shipping_rules SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await query(updateSql, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Shipping rule not found' });
      }

      res.json(result.rows[0]);
    } else {
      res.status(400).json({ error: 'No updates provided' });
    }
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    res.status(500).json({ error: 'Failed to update shipping rule', details: error.message });
  }
});

// Delete shipping rule (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await query('DELETE FROM shipping_rules WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }

    res.json({ message: 'Shipping rule deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    res.status(500).json({ error: 'Failed to delete shipping rule', details: error.message });
  }
});

module.exports = router;
