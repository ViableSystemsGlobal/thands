const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get product sizes by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await query(
      'SELECT * FROM product_sizes WHERE product_id = $1 ORDER BY size',
      [productId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product sizes:', error);
    res.status(500).json({ error: 'Failed to fetch product sizes', details: error.message });
  }
});

// Create product sizes (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, sizes } = req.body;

    if (!product_id || !sizes || !Array.isArray(sizes)) {
      return res.status(400).json({ error: 'product_id and sizes array are required' });
    }

    // Delete existing sizes for this product
    await query('DELETE FROM product_sizes WHERE product_id = $1', [product_id]);

    // Insert new sizes
    const insertPromises = sizes.map(size => 
      query(
        `INSERT INTO product_sizes (product_id, size, price_adjustment, stock_quantity, is_available)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, size.size, size.price_adjustment || 0, size.stock_quantity || 0, size.is_available !== false]
      )
    );

    await Promise.all(insertPromises);

    // Fetch the created sizes
    const result = await query(
      'SELECT * FROM product_sizes WHERE product_id = $1 ORDER BY size',
      [product_id]
    );

    res.status(201).json(result.rows);
  } catch (error) {
    console.error('Error creating product sizes:', error);
    res.status(500).json({ error: 'Failed to create product sizes', details: error.message });
  }
});

// Update product size (Admin only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { size, price_adjustment, stock_quantity, is_available } = req.body;

    const result = await query(
      'UPDATE product_sizes SET size = $1, price_adjustment = $2, stock_quantity = $3, is_available = $4 WHERE id = $5 RETURNING *',
      [size, price_adjustment, stock_quantity, is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product size not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product size:', error);
    res.status(500).json({ error: 'Failed to update product size', details: error.message });
  }
});

// Delete product size (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM product_sizes WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product size not found' });
    }

    res.json({ message: 'Product size deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting product size:', error);
    res.status(500).json({ error: 'Failed to delete product size', details: error.message });
  }
});

module.exports = router;
