const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/faqs - Get all FAQs (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const result = await query(
      `SELECT 
        pf.*,
        p.name as product_name
      FROM product_faqs pf
      LEFT JOIN products p ON pf.product_id = p.id
      ORDER BY pf.created_at DESC`
    );

    // Format the response to match the expected structure
    const faqs = result.rows.map(faq => ({
      ...faq,
      products: faq.product_id ? { id: faq.product_id, name: faq.product_name } : null
    }));

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs', details: error.message });
  }
});

// GET /api/faqs/product/:productId - Get FAQs for specific product (Public)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await query(
      'SELECT * FROM product_faqs WHERE product_id = $1 ORDER BY created_at ASC',
      [productId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch product FAQs', details: error.message });
  }
});

// GET /api/faqs/general - Get general FAQs (Public)
router.get('/general', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM product_faqs WHERE product_id IS NULL ORDER BY created_at ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching general FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch general FAQs', details: error.message });
  }
});

// POST /api/faqs - Create FAQ (Admin only)
router.post('/', authenticateToken, [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
  body('product_id').optional()
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

    const { question, answer, product_id } = req.body;

    const result = await query(
      `INSERT INTO product_faqs (question, answer, product_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [question, answer, product_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ', details: error.message });
  }
});

// PUT /api/faqs/:id - Update FAQ (Admin only)
router.put('/:id', authenticateToken, [
  body('question').optional().trim(),
  body('answer').optional().trim(),
  body('product_id').optional()
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
    const allowedFields = ['question', 'answer', 'product_id'];
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
      `UPDATE product_faqs SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ', details: error.message });
  }
});

// DELETE /api/faqs/:id - Delete FAQ (Admin only)
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
      'DELETE FROM product_faqs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ', details: error.message });
  }
});

module.exports = router;

