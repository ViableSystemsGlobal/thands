const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get wishlist items
router.get('/', async (req, res) => {
  try {
    const { session_id, user_id } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause = `WHERE user_id = $${paramIndex}`;
      params.push(user_id);
    } else if (session_id) {
      whereClause = `WHERE session_id = $${paramIndex}`;
      params.push(session_id);
    } else {
      return res.json([]);
    }

    const result = await query(
      `SELECT 
        wi.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url,
        p.price as product_price,
        p.category as product_category
      FROM wishlist_items wi
      LEFT JOIN products p ON wi.product_id = p.id
      ${whereClause}
      ORDER BY wi.added_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist items', details: error.message });
  }
});

  // Add item to wishlist
router.post('/', async (req, res) => {
  try {
    const { session_id, product_id, user_id } = req.body;

    if (!session_id || !product_id) {
      return res.status(400).json({ error: 'session_id and product_id are required' });
    }

    // Check if item already exists
    const existingResult = await query(
      'SELECT id FROM wishlist_items WHERE session_id = $1 AND product_id = $2',
      [session_id, product_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Item already in wishlist' });
    }

    // Insert new wishlist item
    const result = await query(
      `INSERT INTO wishlist_items (session_id, product_id, user_id, added_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [session_id, product_id, user_id || null]
    );

    // Fetch the complete item with product details
    const itemWithProduct = await query(`
      SELECT 
        wi.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url,
        p.price as product_price,
        p.category as product_category
      FROM wishlist_items wi
      LEFT JOIN products p ON wi.product_id = p.id
      WHERE wi.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(itemWithProduct.rows[0]);
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM wishlist_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist', id: result.rows[0].id });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

// Clear entire wishlist
router.delete('/', async (req, res) => {
  try {
    const { session_id, user_id } = req.body;

    if (!session_id && !user_id) {
      return res.status(400).json({ error: 'session_id or user_id is required' });
    }

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause = `WHERE user_id = $${paramIndex}`;
      params.push(user_id);
    } else {
      whereClause = `WHERE session_id = $${paramIndex}`;
      params.push(session_id);
    }

    const result = await query(
      `DELETE FROM wishlist_items ${whereClause} RETURNING id`,
      params
    );

    res.json({ 
      message: 'Wishlist cleared', 
      itemsRemoved: result.rows.length 
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

// Check if item is in wishlist
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { session_id, user_id } = req.query;

    if (!session_id && !user_id) {
      return res.json({ inWishlist: false });
    }

    let whereClause = '';
    let params = [productId];
    let paramIndex = 2;

    if (user_id) {
      whereClause = `AND user_id = $${paramIndex}`;
      params.push(user_id);
    } else {
      whereClause = `AND session_id = $${paramIndex}`;
      params.push(session_id);
    }

    const result = await query(
      `SELECT id FROM wishlist_items WHERE product_id = $1 ${whereClause}`,
      params
    );

    res.json({ inWishlist: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking wishlist item:', error);
    res.status(500).json({ error: 'Failed to check wishlist item' });
  }
});

module.exports = router;
