const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { requireBranchAccess } = require('../middleware/branchAccess');
const adminBranchFilter = require('../middleware/adminBranchFilter');
const { query } = require('../config/database');
const router = express.Router();

// Get all orders with optional filtering (Admin only)
router.get('/', authenticateToken, requireBranchAccess, adminBranchFilter, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      page = 1, 
      limit = 20, 
      status, 
      payment_status, 
      search,
      start_date,
      end_date,
      branch // Optional branch filter for super admins (deprecated, use X-Admin-Branch-Filter header)
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let baseQuery = `
      SELECT o.*, c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // Use X-Admin-Branch-Filter header if provided (takes precedence)
    const branchFilter = req.adminBranchFilter || branch;

    // Branch filtering for non-super-admins
    if (req.user.role !== 'super_admin') {
      // Only show orders from user's accessible branches
      if (req.userBranches && req.userBranches.length > 0) {
        paramCount++;
        baseQuery += ` AND o.branch_code = ANY($${paramCount})`;
        params.push(req.userBranches);
      } else {
        // User has no branch access
        return res.json({
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    } else {
      // Super admin: optionally filter by branch (header or query param)
      if (branchFilter) {
        paramCount++;
        // Include orders with matching branch_code OR NULL (legacy orders without branch_code)
        baseQuery += ` AND (o.branch_code = $${paramCount} OR o.branch_code IS NULL)`;
        params.push(branchFilter);
      }
      // If branchFilter is null (ALL selected), show all orders including NULL branch_code
    }

    // Add filters
    if (status) {
      paramCount++;
      baseQuery += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (payment_status) {
      paramCount++;
      baseQuery += ` AND o.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    if (search) {
      paramCount++;
      baseQuery += ` AND (
        o.order_number ILIKE $${paramCount} OR 
        c.first_name ILIKE $${paramCount} OR 
        c.last_name ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    if (start_date) {
      paramCount++;
      baseQuery += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      baseQuery += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) as filtered_orders`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = baseQuery + ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);
    
    const ordersResult = await query(dataQuery, params);
    
    // Get order items for each order
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await query(`
        SELECT oi.*, p.name as product_name, p.image_url as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);
      
      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order (Customer/Public endpoint)
router.post('/', [
  body('order_number').notEmpty().withMessage('Order number is required'),
  body('base_subtotal').isFloat({ min: 0 }).withMessage('Valid subtotal is required'),
  body('base_total').isFloat({ min: 0 }).withMessage('Valid total is required'),
  body('shipping_email').isEmail().withMessage('Valid shipping email is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      order_number,
      customer_id,
      user_id,
      status = 'pending',
      payment_status = 'pending',
      payment_method,
      payment_reference,
      base_subtotal,
      base_shipping = 0,
      base_tax = 0,
      base_total,
      total_amount_ghs,
      exchange_rate,
      shipping_email,
      shipping_phone,
      shipping_first_name,
      shipping_last_name,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      billing_email,
      billing_first_name,
      billing_last_name,
      billing_address,
      billing_city,
      billing_state,
      billing_postal_code,
      billing_country,
      voucher_code,
      voucher_discount = 0,
      notes,
      items = []
    } = req.body;

    // Get branch code from context (set by branchContext middleware)
    const branchCode = req.branchCode || 'GH';

    // Create the order
    const orderResult = await query(
      `INSERT INTO orders (
        order_number, customer_id, user_id, status, payment_status, payment_method, payment_reference,
        base_subtotal, base_shipping, base_tax, base_total, total_amount_ghs, exchange_rate,
        shipping_email, shipping_phone, shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_state, shipping_postal_code, shipping_country,
        billing_email, billing_first_name, billing_last_name, billing_address,
        billing_city, billing_state, billing_postal_code, billing_country,
        voucher_code, voucher_discount, notes, branch_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
      RETURNING *`,
      [
        order_number, customer_id, user_id, status, payment_status, payment_method, payment_reference,
        base_subtotal, base_shipping, base_tax, base_total, total_amount_ghs, exchange_rate,
        shipping_email, shipping_phone, shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_state, shipping_postal_code, shipping_country,
        billing_email, billing_first_name, billing_last_name, billing_address,
        billing_city, billing_state, billing_postal_code, billing_country,
        voucher_code, voucher_discount, notes, branchCode
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        const hasProductId = item.product_id && item.product_id.trim() !== '';
        const hasGiftVoucherId = item.gift_voucher_type_id && item.gift_voucher_type_id.trim() !== '';
        const hasCustomName = item.custom_item_name && item.custom_item_name.trim() !== '';

        if (!hasProductId && !hasGiftVoucherId && !hasCustomName) {
          console.error('Order item missing product_id, gift_voucher_type_id, and custom_item_name:', item);
          throw new Error('Order item must have a product, gift voucher, or custom item name');
        }

        if (hasProductId && hasGiftVoucherId) {
          console.error('Order item has both product_id and gift_voucher_type_id:', item);
          throw new Error('Order item cannot have both product_id and gift_voucher_type_id');
        }

        await query(
          `INSERT INTO order_items (order_id, product_id, gift_voucher_type_id, quantity, size, price, custom_item_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            hasProductId ? item.product_id : null,
            hasGiftVoucherId ? item.gift_voucher_type_id : null,
            item.quantity,
            item.size || null,
            item.price,
            hasCustomName ? item.custom_item_name : null
          ]
        );
      }
    }

    // Note: Order confirmation notification removed - will be sent after payment success
    
    // Send admin notification if order is created with payment_status = 'paid'
    if (payment_status === 'paid') {
      try {
        console.log('📧 [ORDER CREATION] Order created with paid status, sending admin notification for order:', order.id);
        const { sendAdminOrderNotification } = require('./notifications');
        if (typeof sendAdminOrderNotification === 'function') {
          const adminResult = await sendAdminOrderNotification(order.id);
          console.log('✅ [ORDER CREATION] Admin order notification result:', adminResult);
        } else {
          console.error('❌ [ORDER CREATION] sendAdminOrderNotification is not a function');
        }
      } catch (adminNotificationError) {
        console.error('❌ [ORDER CREATION] Error sending admin order notification:', adminNotificationError.message || adminNotificationError);
      }
    }

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Get order by order number (Public endpoint) - MUST come before /:id route
router.get('/by-number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Get the order with customer details
    const orderResult = await query(
      `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.order_number = $1`,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      `SELECT oi.*, p.name as product_name, p.image_url as product_image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('❌ Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// Bulk update order status (Admin only)
router.patch('/bulk-status', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { ids, status, payment_status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    if (!status && !payment_status) {
      return res.status(400).json({ error: 'status or payment_status is required' });
    }

    let updateQuery = 'UPDATE orders SET updated_at = NOW()';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateQuery += `, status = $${paramCount}`;
      params.push(status);
    }
    if (payment_status) {
      paramCount++;
      updateQuery += `, payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    paramCount++;
    updateQuery += ` WHERE id = ANY($${paramCount}) RETURNING id`;
    params.push(ids);

    const result = await query(updateQuery, params);

    res.json({ success: true, updated: result.rowCount });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: 'Failed to bulk update orders' });
  }
});

// Bulk delete orders (Admin only)
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    // Delete order items first (foreign key)
    await query('DELETE FROM order_items WHERE order_id = ANY($1)', [ids]);
    const result = await query('DELETE FROM orders WHERE id = ANY($1) RETURNING id', [ids]);

    res.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete orders' });
  }
});

// Get single order by ID (Admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const orderResult = await query(`
      SELECT o.*, c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(`
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({
      ...order,
      items: itemsResult.rows
    });

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, payment_status } = req.body || {};

    if (!status && !payment_status) {
      return res.status(400).json({ error: 'Status or payment_status required' });
    }

    let updateQuery = 'UPDATE orders SET updated_at = NOW()';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateQuery += `, status = $${paramCount}`;
      params.push(status);
    }

    if (payment_status) {
      paramCount++;
      updateQuery += `, payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    paramCount++;
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    // Get the order before update to check if payment_status is changing
    const oldOrderResult = await query('SELECT payment_status FROM orders WHERE id = $1', [id]);
    const oldPaymentStatus = oldOrderResult.rows[0]?.payment_status;

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = result.rows[0];

    // Check international shipping requirements
    if (status === 'shipped' && updatedOrder.is_international && !updatedOrder.tracking_number) {
      return res.status(400).json({ 
        error: 'International orders require a tracking number before marking as shipped',
        requiresTracking: true,
        orderId: id
      });
    }

    // Send admin notification if payment_status changed to 'paid'
    if (payment_status === 'paid' && oldPaymentStatus !== 'paid') {
      try {
        console.log('📧 [ORDER STATUS UPDATE] Payment status changed to paid, sending admin notification for order:', id);
        const { sendAdminOrderNotification } = require('./notifications');
        if (typeof sendAdminOrderNotification === 'function') {
          const adminResult = await sendAdminOrderNotification(id);
          console.log('✅ [ORDER STATUS UPDATE] Admin order notification result:', adminResult);
        } else {
          console.error('❌ [ORDER STATUS UPDATE] sendAdminOrderNotification is not a function');
        }
      } catch (adminNotificationError) {
        console.error('❌ [ORDER STATUS UPDATE] Error sending admin order notification:', adminNotificationError.message || adminNotificationError);
      }
    }

    // Send notifications based on status changes
    try {
      if (status === 'shipped') {
        // Send order shipped notification
        const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/order-shipped`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.headers.authorization}`
          },
          body: JSON.stringify({
            orderId: id,
            shippingData: {
              trackingNumber: req.body.trackingNumber,
              estimatedDelivery: req.body.estimatedDelivery
            }
          })
        });

        if (notificationResponse.ok) {
          console.log('📧 Order shipped notification sent');
        }
      } else if (status === 'delivered') {
        // Send order delivered notification
        const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/order-delivered`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.headers.authorization}`
          },
          body: JSON.stringify({
            orderId: id,
            deliveryData: {
              deliveryDate: new Date().toISOString()
            }
          })
        });

        if (notificationResponse.ok) {
          console.log('📧 Order delivered notification sent');
        }
      }
    } catch (notificationError) {
      console.error('❌ Error sending notification:', notificationError);
      // Don't fail the order update if notification fails
    }

    res.json(updatedOrder);

  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Track order by order number (public endpoint)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await query(
      'SELECT order_number FROM orders WHERE order_number = $1',
      [orderNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order_number: result.rows[0].order_number });
  } catch (error) {
    console.error('Order track error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Get order by order number (public endpoint)
router.get('/by-number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await query(`
      SELECT 
        o.*,
        c.first_name,
        c.last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.country as customer_country,
        c.postal_code as customer_postal_code
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = $1
    `, [orderNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await query(`
      SELECT 
        oi.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [order.id]);

    // Format the response to match the expected structure
    const formattedOrder = {
      ...order,
      customers: {
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email,
        phone: order.phone
      },
      order_items: itemsResult.rows.map(item => ({
        ...item,
        products: {
          id: item.product_id,
          name: item.product_name,
          description: item.product_description,
          image_url: item.product_image_url
        }
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
