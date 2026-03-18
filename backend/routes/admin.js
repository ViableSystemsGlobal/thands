const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const adminBranchFilter = require('../middleware/adminBranchFilter');

// Helper function to build branch filter SQL (returns condition and value)
function buildBranchFilter(branchFilter, tableAlias = '') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (branchFilter) {
    // Include orders with matching branch_code OR NULL (legacy orders without branch_code)
    return {
      condition: `AND (${prefix}branch_code = $ OR ${prefix}branch_code IS NULL)`,
      value: branchFilter
    };
  }
  return null; // No filter = view all branches
}

// Apply branch filter middleware to all admin routes
router.use(adminBranchFilter);

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const branchFilter = req.adminBranchFilter;
    
    // Set default date range if not provided
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const endDate = end_date || new Date().toISOString();

    // Build branch filter
    const branchFilterObj = buildBranchFilter(branchFilter, 'o');
    const branchFilterSQL = branchFilterObj ? branchFilterObj.condition.replace('$', '$3') : '';
    const queryParams = branchFilterObj 
      ? [startDate, endDate, branchFilterObj.value]
      : [startDate, endDate];

    // Get total orders and revenue
    const ordersResult = await query(
      `SELECT COUNT(*) as total_orders, 
              SUM(CASE WHEN payment_status = 'paid' THEN base_total ELSE 0 END) as total_revenue,
              AVG(CASE WHEN payment_status = 'paid' THEN base_total ELSE NULL END) as avg_order_value,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
              SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments
       FROM orders o
       WHERE created_at >= $1 AND created_at <= $2 ${branchFilterSQL}`,
      queryParams
    );

    // Get total customers (all time, not just new ones)
    const customersResult = await query('SELECT COUNT(*) as total_customers FROM customers');

    // Get total products
    const productsResult = await query('SELECT COUNT(*) as total_products FROM products WHERE is_active = true');

    // Get newsletter subscriber metrics
    const newsletterResult = await query(
      `SELECT 
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at >= $1) as new_subscribers_this_period
       FROM newsletter_subscribers`,
      [startDate]
    );

    // Get visitor analytics (using chat sessions as proxy for visitors)
    const visitorResult = await query(
      `SELECT 
        COUNT(*) as total_visitors,
        COUNT(*) FILTER (WHERE created_at >= $1) as visitors_this_period,
        COUNT(DISTINCT DATE(created_at)) as unique_visit_days
       FROM chat_sessions`,
      [startDate]
    );

    // Get daily visitor data for the last 7 days
    const dailyVisitorsResult = await query(
      `SELECT 
        DATE(created_at) as visit_date,
        COUNT(*) as daily_visitors
       FROM chat_sessions 
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY visit_date DESC
       LIMIT 7`,
      [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
    );

    // Get recent orders (limited to 5)
    const recentOrdersBranchFilterObj = buildBranchFilter(branchFilter, 'o');
    const recentOrdersBranchFilterSQL = recentOrdersBranchFilterObj 
      ? recentOrdersBranchFilterObj.condition.replace('$', '$1')
      : '';
    const recentOrdersParams = recentOrdersBranchFilterObj 
      ? [recentOrdersBranchFilterObj.value]
      : [];
    const recentOrdersResult = await query(
      `SELECT o.*, c.first_name, c.last_name, c.email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE 1=1 ${recentOrdersBranchFilterSQL}
       ORDER BY o.created_at DESC
       LIMIT 5`,
      recentOrdersParams
    );

    // Get top products
    const topProductsBranchFilterObj = buildBranchFilter(branchFilter, 'o');
    const topProductsBranchFilterSQL = topProductsBranchFilterObj 
      ? topProductsBranchFilterObj.condition.replace('$', '$3')
      : '';
    const topProductsParams = topProductsBranchFilterObj 
      ? [startDate, endDate, topProductsBranchFilterObj.value]
      : [startDate, endDate];
    const topProductsResult = await query(
      `SELECT p.id, p.name, p.image_url, p.price,
              SUM(oi.quantity) as total_sold,
              COUNT(DISTINCT oi.order_id) as order_count
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.payment_status = 'paid' AND o.created_at >= $1 AND o.created_at <= $2 ${topProductsBranchFilterSQL}
       GROUP BY p.id, p.name, p.image_url, p.price
       ORDER BY total_sold DESC
       LIMIT 10`,
      topProductsParams
    );

    // Get daily revenue for sales chart
    const salesChartParams = branchFilterObj ? [startDate, endDate, branchFilterObj.value] : [startDate, endDate];
    const salesChartBranchSQL = branchFilterObj ? branchFilterObj.condition.replace('$', '$3') : '';
    const salesChartResult = await query(
      `SELECT DATE(created_at) as sale_date,
              SUM(CASE WHEN payment_status = 'paid' THEN base_total ELSE 0 END) as daily_revenue,
              COUNT(*) as daily_orders
       FROM orders o
       WHERE created_at >= $1 AND created_at <= $2 ${salesChartBranchSQL}
       GROUP BY DATE(created_at)
       ORDER BY sale_date ASC`,
      salesChartParams
    );

    // Get order status breakdown
    const statusBreakdownResult = await query(
      `SELECT status, COUNT(*) as count
       FROM orders o
       WHERE created_at >= $1 AND created_at <= $2 ${salesChartBranchSQL}
       GROUP BY status`,
      salesChartParams
    );

    // Format sales chart data for Chart.js
    const chartLabels = salesChartResult.rows.map(r =>
      new Date(r.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const chartRevenue = salesChartResult.rows.map(r => parseFloat(r.daily_revenue || 0));

    const salesChartData = {
      labels: chartLabels,
      datasets: [{
        label: 'Revenue (USD)',
        data: chartRevenue,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointRadius: 4,
      }]
    };

    const dashboardData = {
      stats: {
        totalOrders: parseInt(ordersResult.rows[0]?.total_orders || 0),
        totalSales: parseFloat(ordersResult.rows[0]?.total_revenue || 0),
        avgOrderValue: parseFloat(ordersResult.rows[0]?.avg_order_value || 0),
        totalCustomers: parseInt(customersResult.rows[0]?.total_customers || 0),
        pendingOrders: parseInt(ordersResult.rows[0]?.pending_orders || 0),
        pendingPayments: parseInt(ordersResult.rows[0]?.pending_payments || 0),
        totalProducts: parseInt(productsResult.rows[0]?.total_products || 0),
        totalNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.total_subscribers || 0),
        activeNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.active_subscribers || 0),
        newNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.new_subscribers_this_period || 0),
        totalVisitors: parseInt(visitorResult.rows[0]?.total_visitors || 0),
        visitorsThisPeriod: parseInt(visitorResult.rows[0]?.visitors_this_period || 0),
        uniqueVisitDays: parseInt(visitorResult.rows[0]?.unique_visit_days || 0),
        dailyVisitors: dailyVisitorsResult.rows,
        orderStatusBreakdown: statusBreakdownResult.rows,
      },
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows,
      salesChartData,
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get all settings
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings LIMIT 1');
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        store_name: 'Tailored Hands',
        contact_email: 'hello@tailoredhands.africa',
        contact_phone: '+233 24 532 7668',
        exchange_rate_ghs: 16.0,
        exchange_rate_gbp: 0.79,
        hero_image_url: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png',
        hero_title: 'Modern Elegance Redefined',
        hero_subtitle: 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
        hero_button_text: 'EXPLORE COLLECTION'
      };
      
      return res.json({
        success: true,
        settings: defaultSettings
      });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});


// PUT /api/admin/settings - Update settings
router.put('/settings', authenticateToken, async (req, res) => {
    try {
      console.log('🔍 Received settings update request:', {
        paystack_public_key: req.body.paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: req.body.paystack_secret_key ? 'SET' : 'NOT SET',
        body_keys: Object.keys(req.body)
      });
      
      const {
        store_name,
        contact_email,
        contact_phone,
        address,
        store_description,
        currency,
        timezone,
        exchange_rate_ghs,
        exchange_rate_gbp,
        paystack_public_key,
        paystack_secret_key,
        hero_image_url,
        hero_title,
        hero_subtitle,
        hero_button_text,
        favicon_url,
        navbar_logo_url,
        footer_logo_url,
        captcha_enabled,
        google_places_api_key,
        google_auth_enabled,
        google_client_id
      } = req.body;
      
      console.log('🔍 Destructured Paystack keys:', {
        paystack_public_key: paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: paystack_secret_key ? 'SET' : 'NOT SET'
      });

    // Debug logging
    console.log('🔍 Backend received google_places_api_key:', google_places_api_key);
    console.log('🔍 Backend received store_name:', store_name);

    // Check if settings exist
    const existingSettings = await query('SELECT id FROM settings LIMIT 1');

    let result;
    if (existingSettings.rows.length === 0) {
      // Create new settings record
      result = await query(
        `INSERT INTO settings (
          store_name, contact_email, contact_phone, address, store_description,
          currency, timezone, exchange_rate_ghs, exchange_rate_gbp, paystack_public_key, paystack_secret_key,
          hero_image_url, hero_title, hero_subtitle, hero_button_text, favicon_url,
          navbar_logo_url, footer_logo_url, captcha_enabled, google_places_api_key,
          google_auth_enabled, google_client_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
         RETURNING *`,
        [store_name, contact_email, contact_phone, address, store_description,
         currency, timezone, exchange_rate_ghs, exchange_rate_gbp || 0.79, paystack_public_key, paystack_secret_key,
         hero_image_url, hero_title, hero_subtitle, hero_button_text, favicon_url,
         navbar_logo_url, footer_logo_url, captcha_enabled, google_places_api_key,
         google_auth_enabled || false, google_client_id || null]
      );
    } else {
      // Update existing settings
      result = await query(
        `UPDATE settings SET
          store_name = COALESCE($1, store_name),
          contact_email = COALESCE($2, contact_email),
          contact_phone = COALESCE($3, contact_phone),
          address = COALESCE($4, address),
          store_description = COALESCE($5, store_description),
          currency = COALESCE($6, currency),
          timezone = COALESCE($7, timezone),
          exchange_rate_ghs = COALESCE($8, exchange_rate_ghs),
          exchange_rate_gbp = COALESCE($9, exchange_rate_gbp),
          paystack_public_key = COALESCE($10, paystack_public_key),
          paystack_secret_key = COALESCE($11, paystack_secret_key),
          hero_image_url = COALESCE($12, hero_image_url),
          hero_title = COALESCE($13, hero_title),
          hero_subtitle = COALESCE($14, hero_subtitle),
          hero_button_text = COALESCE($15, hero_button_text),
          favicon_url = COALESCE($16, favicon_url),
          navbar_logo_url = COALESCE($17, navbar_logo_url),
          footer_logo_url = COALESCE($18, footer_logo_url),
          captcha_enabled = COALESCE($19, captcha_enabled),
          google_places_api_key = COALESCE($20, google_places_api_key),
          google_auth_enabled = COALESCE($21, google_auth_enabled),
          google_client_id = COALESCE($22, google_client_id),
          updated_at = NOW()
        WHERE id = $23
        RETURNING *`,
        [store_name, contact_email, contact_phone, address, store_description,
         currency, timezone, exchange_rate_ghs, exchange_rate_gbp || 0.79, paystack_public_key, paystack_secret_key,
         hero_image_url, hero_title, hero_subtitle, hero_button_text, favicon_url,
         navbar_logo_url, footer_logo_url, captcha_enabled, google_places_api_key,
         google_auth_enabled ?? null, google_client_id ?? null, existingSettings.rows[0].id]
      );
      
      console.log('🔍 SQL UPDATE executed with Paystack keys:', {
        paystack_public_key: paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: paystack_secret_key ? 'SET' : 'NOT SET'
      });
    }

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Error updating settings:', error);
    const message = error.message || 'Failed to update settings';
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV !== 'production' ? message : 'Failed to update settings',
    });
  }
});

// GET /api/admin/users - Get admin users
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, created_at 
       FROM admin_users 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Create new admin user
router.post('/users', async (req, res) => {
  try {
    const { email, full_name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    const result = await query(
      `INSERT INTO admin_users (email, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, full_name, role, created_at`,
      [email, full_name, role]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// DELETE /api/admin/users/:id - Delete admin user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM admin_users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// PUT /api/admin/users/:id/password - Update user password
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Note: In a real implementation, you'd hash the password
    // For now, we'll just return success since this is admin-only
    // and the actual password change would be handled by the auth system
    
    res.json({ success: true, message: 'Password update functionality needs to be implemented with proper auth system' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

// PUT /api/admin/settings/google-places-api-key - Update only Google Places API key
router.put('/settings/google-places-api-key', authenticateToken, async (req, res) => {
  try {
    const { google_places_api_key } = req.body;
    
    console.log('🔍 Dedicated route received google_places_api_key:', google_places_api_key);
    
    const result = await query(
      'UPDATE settings SET google_places_api_key = $1 WHERE id = 1 RETURNING google_places_api_key',
      [google_places_api_key]
    );
    
    console.log('🔍 Database update result:', result.rows[0]);
    
    res.json({ 
      success: true, 
      google_places_api_key: result.rows[0].google_places_api_key 
    });
  } catch (error) {
    console.error('Error updating Google Places API key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update Google Places API key' 
    });
  }
});

// GET /api/admin/notifications - New orders + unread messages for the bell
router.get('/notifications', async (req, res) => {
  try {
    const [ordersResult, messagesResult] = await Promise.all([
      query(
        `SELECT id, order_number, created_at, base_total,
                shipping_first_name, shipping_last_name
         FROM orders
         WHERE status = 'pending'
           AND created_at >= NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC
         LIMIT 10`
      ),
      query(
        `SELECT id, name, subject, message, created_at
         FROM messages
         WHERE status = 'new'
         ORDER BY created_at DESC
         LIMIT 10`
      ),
    ]);

    const items = [
      ...ordersResult.rows.map((o) => ({
        type: 'order',
        id: o.id,
        title: `New order ${o.order_number}`,
        subtitle: `${o.shipping_first_name || ''} ${o.shipping_last_name || ''}`.trim() ||
                  'Customer',
        time: o.created_at,
        path: '/admin/orders',
      })),
      ...messagesResult.rows.map((m) => ({
        type: 'message',
        id: m.id,
        title: m.subject || `Message from ${m.name}`,
        subtitle: (m.message || '').substring(0, 60),
        time: m.created_at,
        path: '/admin/communication/messages',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ total: items.length, items });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;