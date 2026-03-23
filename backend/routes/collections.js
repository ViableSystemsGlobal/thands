const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

// Public endpoint to get active collections for homepage
// MUST be before /:id to avoid route conflict
router.get('/public/active', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, description, search_terms, image_url, slug
      FROM collections
      WHERE is_active = true
      ORDER BY created_at ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching public collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get collections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query(`
      SELECT id, name, description, search_terms, image_url, is_active, slug, created_at, updated_at
      FROM collections
      ORDER BY created_at ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Create or update collections
router.post('/', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { collections } = req.body;

    if (!Array.isArray(collections)) {
      return res.status(400).json({ error: 'Collections must be an array' });
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Clear existing collections
      await query('DELETE FROM collections');

      // Insert new collections
      for (const collection of collections) {
        const { name, description, search_terms, image_url } = collection;

        if (!name || !description) {
          throw new Error('Collection name and description are required');
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        await query(`
          INSERT INTO collections (name, description, search_terms, image_url, is_active, slug)
          VALUES ($1, $2, $3, $4, true, $5)
        `, [name, description, search_terms || '', image_url || '', slug]);
      }

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Collections saved successfully',
        data: collections
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving collections:', error);
    res.status(500).json({
      error: 'Failed to save collections',
      details: error.message
    });
  }
});

// Get single collection
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const result = await query(`
      SELECT id, name, description, search_terms, image_url, is_active, slug, created_at, updated_at
      FROM collections
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Update single collection
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, description, search_terms, image_url, is_active } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Collection name and description are required' });
    }

    const result = await query(`
      UPDATE collections
      SET name = $1, description = $2, search_terms = $3, image_url = $4, is_active = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, description, search_terms || '', image_url || '', is_active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const result = await query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

module.exports = router;
