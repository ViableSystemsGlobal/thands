const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get cart items
router.get('/', async (req, res) => {
  try {
    const { session_id, user_id } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause = `WHERE ci.user_id = $${paramIndex}`;
      params.push(user_id);
    } else if (session_id) {
      whereClause = `WHERE ci.session_id = $${paramIndex}`;
      params.push(session_id);
    } else {
      return res.json([]);
    }

    const result = await query(
      `SELECT 
        ci.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url,
        p.price as product_price,
        p.category as product_category,
        COALESCE(
          p.price + ps.price_adjustment, 
          p.price
        ) as adjusted_product_price,
        ps.price_adjustment,
        gvt.id as gift_voucher_type_id,
        gvt.name as gift_voucher_name,
        gvt.amount as gift_voucher_amount,
        gvt.description as gift_voucher_description,
        gvt.image_url as gift_voucher_image_url
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_sizes ps ON p.id = ps.product_id AND ci.size = ps.size
      LEFT JOIN gift_voucher_types gvt ON ci.gift_voucher_type_id = gvt.id
      ${whereClause}
      ORDER BY ci.added_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Failed to fetch cart items', details: error.message });
  }
});

// Add item to cart
router.post('/', async (req, res) => {
  try {
    const { session_id, product_id, gift_voucher_type_id, quantity, size, user_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    if (!product_id && !gift_voucher_type_id) {
      return res.status(400).json({ error: 'product_id or gift_voucher_type_id is required' });
    }

    const qty = quantity || 1;

    // Check if item already exists
    let existingResult;
    if (product_id) {
      existingResult = await query(
        'SELECT id, quantity FROM cart_items WHERE session_id = $1 AND product_id = $2 AND size = $3',
        [session_id, product_id, size || null]
      );
    } else {
      existingResult = await query(
        'SELECT id, quantity FROM cart_items WHERE session_id = $1 AND gift_voucher_type_id = $2',
        [session_id, gift_voucher_type_id]
      );
    }

    if (existingResult.rows.length > 0) {
      // Update existing item quantity
      const newQuantity = existingResult.rows[0].quantity + qty;
      const result = await query(
        'UPDATE cart_items SET quantity = $1, added_at = NOW() WHERE id = $2 RETURNING *',
        [newQuantity, existingResult.rows[0].id]
      );

      // Fetch the complete item with product/gift voucher details
      const itemWithDetails = await query(
        `SELECT 
          ci.*,
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.image_url as product_image_url,
          p.price as product_price,
          p.category as product_category,
          COALESCE(
            p.price + ps.price_adjustment, 
            p.price
          ) as adjusted_product_price,
          ps.price_adjustment,
          gvt.id as gift_voucher_type_id,
          gvt.name as gift_voucher_name,
          gvt.amount as gift_voucher_amount,
          gvt.description as gift_voucher_description,
          gvt.image_url as gift_voucher_image_url
        FROM cart_items ci
        LEFT JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_sizes ps ON p.id = ps.product_id AND ci.size = ps.size
        LEFT JOIN gift_voucher_types gvt ON ci.gift_voucher_type_id = gvt.id
        WHERE ci.id = $1`,
        [result.rows[0].id]
      );

      return res.json(itemWithDetails.rows[0]);
    } else {
      // Insert new cart item
      const result = await query(
        `INSERT INTO cart_items (session_id, product_id, gift_voucher_type_id, quantity, size, user_id, added_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [session_id, product_id || null, gift_voucher_type_id || null, qty, size || null, user_id || null]
      );

      // Fetch the complete item with product/gift voucher details
      const itemWithDetails = await query(
        `SELECT 
          ci.*,
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.image_url as product_image_url,
          p.price as product_price,
          p.category as product_category,
          COALESCE(
            p.price + ps.price_adjustment, 
            p.price
          ) as adjusted_product_price,
          ps.price_adjustment,
          gvt.id as gift_voucher_type_id,
          gvt.name as gift_voucher_name,
          gvt.amount as gift_voucher_amount,
          gvt.description as gift_voucher_description,
          gvt.image_url as gift_voucher_image_url
        FROM cart_items ci
        LEFT JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_sizes ps ON p.id = ps.product_id AND ci.size = ps.size
        LEFT JOIN gift_voucher_types gvt ON ci.gift_voucher_type_id = gvt.id
        WHERE ci.id = $1`,
        [result.rows[0].id]
      );

      res.status(201).json(itemWithDetails.rows[0]);
    }
  } catch (error) {
    console.error('Error adding cart item:', error);
    res.status(500).json({ error: 'Failed to add item to cart', details: error.message });
  }
});

// Update cart item quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: 'Valid quantity is required' });
    }

    const result = await query(
      'UPDATE cart_items SET quantity = $1, added_at = NOW() WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    // Fetch the complete item with product/gift voucher details
    const itemWithDetails = await query(
      `SELECT 
        ci.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url,
        p.price as product_price,
        p.category as product_category,
        COALESCE(
          p.price + ps.price_adjustment, 
          p.price
        ) as adjusted_product_price,
        ps.price_adjustment,
        gvt.id as gift_voucher_type_id,
        gvt.name as gift_voucher_name,
        gvt.amount as gift_voucher_amount,
        gvt.description as gift_voucher_description,
        gvt.image_url as gift_voucher_image_url
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_sizes ps ON p.id = ps.product_id AND ci.size = ps.size
      LEFT JOIN gift_voucher_types gvt ON ci.gift_voucher_type_id = gvt.id
      WHERE ci.id = $1`,
      [id]
    );

    res.json({ success: true, data: itemWithDetails.rows[0] });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, error: 'Failed to update cart item', details: error.message });
  }
});

// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM cart_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart', id: result.rows[0].id });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove item from cart', details: error.message });
  }
});

// Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const { session_id, user_id } = req.body || {};

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
      `DELETE FROM cart_items ${whereClause} RETURNING id`,
      params
    );

    res.json({ 
      message: 'Cart cleared', 
      itemsRemoved: result.rows.length 
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart', details: error.message });
  }
});

module.exports = router;
