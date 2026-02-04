const express = require('express');
const { body, validationResult, query: validateQuery } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all products with optional filtering
router.get('/', [
  validateQuery('category').optional().trim(),
  validateQuery('active').optional().custom((value) => {
    if (value === 'all' || value === 'true' || value === 'false') {
      return true;
    }
    throw new Error('Active must be "all", "true", or "false"');
  }),
  validateQuery('limit').optional().isInt({ min: 1, max: 1000 }),
  validateQuery('offset').optional().isInt({ min: 0 }),
  validateQuery('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, active = 'true', limit = 50, offset = 0, search } = req.query;
    
        // First, get the product IDs with pagination
        let productSql = `
          SELECT p.id
          FROM products p
          WHERE 1=1
        `;
        
        const productParams = [];
        let productParamCount = 0;

        if (category) {
          productParamCount++;
          productSql += ` AND p.category = $${productParamCount}`;
          productParams.push(category);
        }

        if (active && active !== 'all') {
          productParamCount++;
          productSql += ` AND p.is_active = $${productParamCount}`;
          productParams.push(active === 'true');
        }

        // Add search functionality
        if (search && search.trim()) {
          productParamCount++;
          productSql += ` AND (p.name ILIKE $${productParamCount} OR p.description ILIKE $${productParamCount} OR p.category ILIKE $${productParamCount})`;
          productParams.push(`%${search.trim()}%`);
        }

        // Add LIMIT and OFFSET parameters
        productParamCount++;
        productSql += ` ORDER BY p.created_at DESC LIMIT $${productParamCount}`;
        productParams.push(parseInt(limit));
        
        productParamCount++;
        productSql += ` OFFSET $${productParamCount}`;
        productParams.push(parseInt(offset));

        const productResult = await query(productSql, productParams);
        
        if (productResult.rows.length === 0) {
          return res.json({ products: [], totalCount: 0 });
        }

        // Now get the full product details with sizes for these specific products
        const productIds = productResult.rows.map(row => row.id);
        const placeholders = productIds.map((_, index) => `$${index + 1}`).join(',');
        
        let sql = `
          SELECT p.*, 
                 ps.id as size_id, ps.size, ps.price_adjustment, ps.stock_quantity as size_stock,
                 ps.is_available as size_available
          FROM products p
          LEFT JOIN product_sizes ps ON p.id = ps.product_id
          WHERE p.id IN (${placeholders})
          ORDER BY p.created_at DESC, ps.size
        `;
        
        // Note: p.* includes all columns from products table including is_featured

        const result = await query(sql, productIds);

    // Group products with their sizes
    const productsMap = new Map();
    result.rows.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          base_price: parseFloat(row.price),
          price_usd: row.price_usd ? parseFloat(row.price_usd) : null,
          product_type: row.product_type,
          image_url: row.image_url,
          is_active: row.is_active,
          is_featured: row.is_featured || false,
          stock_quantity: row.stock_quantity,
          sku: row.sku,
          weight: row.weight ? parseFloat(row.weight) : null,
          dimensions_length: row.dimensions_length ? parseFloat(row.dimensions_length) : null,
          dimensions_width: row.dimensions_width ? parseFloat(row.dimensions_width) : null,
          dimensions_height: row.dimensions_height ? parseFloat(row.dimensions_height) : null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product_sizes: []
        });
      }

      if (row.size) {
        productsMap.get(row.id).product_sizes.push({
          id: row.size_id,
          size: row.size,
          price_adjustment: parseFloat(row.price_adjustment || 0),
          stock_quantity: row.size_stock,
          is_available: row.size_available
        });
      }
    });

    const products = Array.from(productsMap.values());

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countSql += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (active !== 'all') {
      countParamCount++;
      countSql += ` AND is_active = $${countParamCount}`;
      countParams.push(active === 'true');
    }

    if (search && search.trim()) {
      countParamCount++;
      countSql += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount} OR category ILIKE $${countParamCount})`;
      countParams.push(`%${search.trim()}%`);
    }

    const countResult = await query(countSql, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      products,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product metrics (Admin only) - MUST be before /:id route
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    console.log('🔍 Products Metrics: Fetching metrics for all products...');

    // Get total products count
    const totalResult = await query('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(totalResult.rows[0].count);

    // Get active products count
    const activeResult = await query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    const activeProducts = parseInt(activeResult.rows[0].count);

    // Get inactive products count
    const inactiveResult = await query('SELECT COUNT(*) as count FROM products WHERE is_active = false');
    const inactiveProducts = parseInt(inactiveResult.rows[0].count);

    // Get featured products count (checking if category contains 'Featured')
    const featuredResult = await query("SELECT COUNT(*) as count FROM products WHERE category ILIKE '%Featured%'");
    const featuredProducts = parseInt(featuredResult.rows[0].count);

    // Get average price
    const avgResult = await query('SELECT AVG(price) as avg_price FROM products WHERE price IS NOT NULL');
    const averagePrice = parseFloat(avgResult.rows[0].avg_price) || 0;

    // Get category breakdown
    const categoryResult = await query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC
    `);
    const categoryBreakdown = categoryResult.rows;

    const metrics = {
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      averagePrice,
      categoryBreakdown
    };

    console.log('✅ Products Metrics: Calculated metrics:', metrics);

    res.json(metrics);

  } catch (error) {
    console.error('❌ Products Metrics Error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch product metrics', details: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get product details
    const productResult = await query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Get product sizes
    const sizesResult = await query(
      'SELECT * FROM product_sizes WHERE product_id = $1 ORDER BY size',
      [id]
    );

    // Convert numeric fields
    product.base_price = parseFloat(product.price);
    if (product.weight) product.weight = parseFloat(product.weight);
    if (product.dimensions_length) product.dimensions_length = parseFloat(product.dimensions_length);
    if (product.dimensions_width) product.dimensions_width = parseFloat(product.dimensions_width);
    if (product.dimensions_height) product.dimensions_height = parseFloat(product.dimensions_height);

    // Add product_sizes in the format expected by the frontend
    product.product_sizes = sizesResult.rows.map(size => ({
      id: size.id,
      size: size.size,
      price_adjustment: parseFloat(size.price_adjustment || 0),
      stock_quantity: size.stock_quantity,
      is_available: size.is_available
    }));

    res.json(product);

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (Admin only)
router.post('/', authenticateToken, 
  body('name').trim().notEmpty().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('category').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('sku').optional().trim(),
  async (req, res) => {
  try {
    // Check if user is admin
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
      description,
      category,
      price,
      price_usd,
      image_url,
      stock_quantity = 0,
      sku,
      weight,
      dimensions_length,
      dimensions_width,
      dimensions_height,
      product_type = 'made_to_measure',
      is_featured = false,
      sizes = []
    } = req.body;

    // Check if SKU already exists (only if SKU is provided and not empty)
    if (sku && sku.trim()) {
      const existingSku = await query('SELECT id FROM products WHERE sku = $1', [sku.trim()]);
      if (existingSku.rows.length > 0) {
        console.log('[Products API] SKU already exists during creation:', sku);
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    // Create product - price field stores USD, price_usd is redundant but kept for compatibility
    const productResult = await query(
      `INSERT INTO products (name, description, category, price, price_usd, image_url, stock_quantity, sku, weight, dimensions_length, dimensions_width, dimensions_height, product_type, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, description, category, price, price || price_usd, image_url, stock_quantity, sku, weight, dimensions_length, dimensions_width, dimensions_height, product_type, is_featured]
    );

    const product = productResult.rows[0];

    // Add product sizes if provided
    if (sizes && sizes.length > 0) {
      for (const size of sizes) {
        await query(
          'INSERT INTO product_sizes (product_id, size, price_adjustment, stock_quantity, is_available) VALUES ($1, $2, $3, $4, $5)',
          [product.id, size.size, size.price_adjustment || 0, size.stock_quantity || 0, size.is_available !== false]
        );
      }
    }

    res.status(201).json({
      success: true,
      product: {
        ...product,
        price: parseFloat(product.price)
      }
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('category').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('sku').optional().trim(),
  body('product_type').optional().trim(),
  body('is_featured').optional().isBoolean()
], async (req, res) => {
  console.log(`[Products API] Attempting to update product ${req.params.id}`);
  console.log('[Products API] Request body:', req.body);
  console.log('[Products API] User:', req.user);
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('[Products API] Access denied - user is not admin:', req.user.role);
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[Products API] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;
    console.log('[Products API] Updates to apply:', updates);

    // Check if product exists
    console.log('[Products API] Checking if product exists:', id);
    const existingProduct = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      console.log('[Products API] Product not found:', id);
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('[Products API] Product exists, proceeding with update');

    // Check if SKU already exists (if updating SKU and it's not empty)
    if (updates.sku && updates.sku.trim()) {
      const existingSku = await query('SELECT id FROM products WHERE sku = $1 AND id != $2', [updates.sku.trim(), id]);
      if (existingSku.rows.length > 0) {
        console.log('[Products API] SKU already exists:', updates.sku);
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (key !== 'sizes' && updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length > 0) {
      paramCount++;
      updateFields.push('updated_at = NOW()');
      values.push(id);

      const updateSql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await query(updateSql, values);
      
      console.log(`[Products API] Product ${id} updated successfully.`);
      res.json({
        success: true,
        product: {
          ...result.rows[0],
          price: parseFloat(result.rows[0].price)
        }
      });
    } else {
      res.json({ success: true, message: 'No updates provided' });
    }

  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (cascades to product_sizes)
    await query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});


module.exports = router;
