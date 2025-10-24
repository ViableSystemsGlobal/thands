const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

// Helper function to check if ID is a registered user UUID
const isRegisteredUserUUID = (id) => {
  return id && typeof id === 'string' && id.length === 36;
};

// GET /api/customers - Admin endpoint to get all customers with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build query
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search && search.trim()) {
      paramCount++;
      whereClause += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search.trim()}%`);
    }

    // Validate sort_by
    const allowedSortFields = ['created_at', 'email', 'first_name', 'last_name'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get customers with pagination
    const customersQuery = `
      SELECT 
        id, email, first_name, last_name, phone, created_at, updated_at,
        CASE WHEN user_id IS NOT NULL THEN true ELSE false END as is_registered
      FROM customers 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limitNum, offset);
    const customersResult = await query(customersQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset params
    const total = parseInt(countResult.rows[0].total);

    res.json({
      customers: customersResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + limitNum < total
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
});

// GET /api/customers/metrics - Admin endpoint for customer metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Get total customers
    const totalResult = await query('SELECT COUNT(*) as count FROM customers');
    const totalCustomers = parseInt(totalResult.rows[0].count);

    // Get registered customers (those with user_id)
    const registeredResult = await query('SELECT COUNT(*) as count FROM customers WHERE user_id IS NOT NULL');
    const registeredCustomers = parseInt(registeredResult.rows[0].count);

    // Get guest customers
    const guestCustomers = totalCustomers - registeredCustomers;

    // Get customers created in last 30 days
    const recentResult = await query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const recentCustomers = parseInt(recentResult.rows[0].count);

    // Get customers created this month
    const thisMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `);
    const newCustomersThisMonth = parseInt(thisMonthResult.rows[0].count);

    // Get average order value (from orders table)
    const avgOrderValueResult = await query(`
      SELECT AVG(total_amount_ghs) as avg_value 
      FROM orders 
      WHERE status NOT IN ('cancelled', 'failed')
    `);
    const averageOrderValue = parseFloat(avgOrderValueResult.rows[0].avg_value) || 0;

    // Get customers by month (last 6 months)
    const monthlyResult = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM customers 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    const metrics = {
      totalCustomers,
      registeredCustomers,
      guestCustomers,
      recentCustomers,
      newCustomersThisMonth,
      averageOrderValue,
      monthlyData: monthlyResult.rows.map(row => ({
        month: row.month.toISOString().split('T')[0],
        count: parseInt(row.count)
      }))
    };

    res.json(metrics);

  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    res.status(500).json({ error: 'Failed to fetch customer metrics', details: error.message });
  }
});

// POST /api/customers/get-or-create - Get existing customer or create new one
router.post('/get-or-create', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('phone').optional().isString(),
  body('attemptAccountCreation').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, firstName, lastName, phone, attemptAccountCreation = false } = req.body;

  try {
    // Search for existing customer
    const existingCustomerResult = await query(
      'SELECT * FROM customers WHERE email = $1',
      [email.toLowerCase()]
    );

    const existingCustomer = existingCustomerResult.rows[0];

    if (existingCustomer) {
      // Customer exists
      if (isRegisteredUserUUID(existingCustomer.id)) {
        // Registered user
        if (attemptAccountCreation) {
          return res.status(400).json({ 
            success: false, 
            error: 'An account with this email already exists. Please log in or use a different email.' 
          });
        }
        
        // Update existing registered user
        const updatedCustomerResult = await query(
          `UPDATE customers SET 
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *`,
          [firstName, lastName, phone, existingCustomer.id]
        );

        return res.json({ success: true, data: updatedCustomerResult.rows[0] });
      } else {
        // Guest user
        if (attemptAccountCreation) {
          return res.status(400).json({ 
            success: false, 
            error: 'A guest order with this email already exists. Please log in or use a different email.' 
          });
        }
        
        // Update existing guest user
        const updatedCustomerResult = await query(
          `UPDATE customers SET 
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *`,
          [firstName, lastName, phone, existingCustomer.id]
        );

        return res.json({ success: true, data: updatedCustomerResult.rows[0] });
      }
    } else {
      // Customer doesn't exist
      if (attemptAccountCreation) {
        return res.status(400).json({ 
          success: false, 
          error: 'Account creation requires authentication. Please use the registration endpoint.' 
        });
      } else {
        // Create new guest customer
        const newCustomerResult = await query(
          `INSERT INTO customers (
            email, first_name, last_name, phone, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *`,
          [email.toLowerCase(), firstName, lastName, phone]
        );

        return res.json({ success: true, data: newCustomerResult.rows[0] });
      }
    }
  } catch (error) {
    console.error('Error in get-or-create customer:', error);
    res.status(500).json({ success: false, error: 'Failed to get or create customer', details: error.message });
  }
});

// POST /api/customers/guest - Create guest customer
router.post('/guest', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('phone').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, firstName, lastName, phone } = req.body;

  try {
    const newCustomerResult = await query(
      `INSERT INTO customers (
        email, first_name, last_name, phone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [email.toLowerCase(), firstName, lastName, phone]
    );

    res.json({ success: true, data: newCustomerResult.rows[0] });
  } catch (error) {
    console.error('Error creating guest customer:', error);
    res.status(500).json({ success: false, error: 'Failed to create guest customer', details: error.message });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', [
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('phone').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { firstName, lastName, phone } = req.body;

  try {
    const updatedCustomerResult = await query(
      `UPDATE customers SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [firstName, lastName, phone, id]
    );

    if (updatedCustomerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: updatedCustomerResult.rows[0] });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer', details: error.message });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customerResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [req.params.id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customerResult.rows[0] });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to get customer', details: error.message });
  }
});

// GET /api/customers/search - Search customer by email
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email query parameter is required' });
    }

    const customerResult = await query(
      'SELECT * FROM customers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customerResult.rows[0] });
  } catch (error) {
    console.error('Error searching for customer:', error);
    res.status(500).json({ success: false, error: 'Failed to search for customer', details: error.message });
  }
});

module.exports = router;