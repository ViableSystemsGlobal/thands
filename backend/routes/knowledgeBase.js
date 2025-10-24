const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/knowledge-base - Get all knowledge base entries
router.get('/', async (req, res) => {
  try {
    const {
      category,
      is_active,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let queryText = 'SELECT * FROM knowledge_base WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (is_active !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
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
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge base entries:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base entries', details: error.message });
  }
});

// GET /api/knowledge-base/categories - Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT category 
       FROM knowledge_base 
       WHERE category IS NOT NULL 
       ORDER BY category`
    );

    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching knowledge base categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// GET /api/knowledge-base/:id - Get single entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM knowledge_base WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching knowledge base entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry', details: error.message });
  }
});

// POST /api/knowledge-base - Create entry (Admin only)
router.post('/', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().trim(),
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
      title,
      content,
      category,
      is_active = true
    } = req.body;

    const result = await query(
      `INSERT INTO knowledge_base (title, content, category, is_active, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [title, content, category || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating knowledge base entry:', error);
    res.status(500).json({ error: 'Failed to create entry', details: error.message });
  }
});

// PUT /api/knowledge-base/:id - Update entry (Admin only)
router.put('/:id', authenticateToken, [
  body('title').optional().trim(),
  body('content').optional().trim(),
  body('category').optional().trim(),
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
    const allowedFields = ['title', 'content', 'category', 'is_active'];
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
      `UPDATE knowledge_base SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating knowledge base entry:', error);
    res.status(500).json({ error: 'Failed to update entry', details: error.message });
  }
});

// DELETE /api/knowledge-base/:id - Delete entry (Admin only)
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
      'DELETE FROM knowledge_base WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    res.json({ message: 'Entry deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting knowledge base entry:', error);
    res.status(500).json({ error: 'Failed to delete entry', details: error.message });
  }
});

module.exports = router;

