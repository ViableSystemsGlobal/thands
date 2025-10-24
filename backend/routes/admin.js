const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Set default date range if not provided
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const endDate = end_date || new Date().toISOString();

    // Get total orders and revenue
    const ordersResult = await query(
      `SELECT COUNT(*) as total_orders, 
              SUM(CASE WHEN payment_status = 'paid' THEN base_total ELSE 0 END) as total_revenue,
              AVG(CASE WHEN payment_status = 'paid' THEN base_total ELSE NULL END) as avg_order_value,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
       FROM orders 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
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
    const recentOrdersResult = await query(
      `SELECT o.*, c.first_name, c.last_name, c.email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    // Get top products
    const topProductsResult = await query(
      `SELECT p.id, p.name, p.image_url, p.price,
              SUM(oi.quantity) as total_sold,
              COUNT(DISTINCT oi.order_id) as order_count
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.payment_status = 'paid' AND o.created_at >= $1 AND o.created_at <= $2
       GROUP BY p.id, p.name, p.image_url, p.price
       ORDER BY total_sold DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    const dashboardData = {
      stats: {
        totalOrders: parseInt(ordersResult.rows[0]?.total_orders || 0),
        totalSales: parseFloat(ordersResult.rows[0]?.total_revenue || 0), // Frontend expects totalSales
        avgOrderValue: parseFloat(ordersResult.rows[0]?.avg_order_value || 0),
        totalCustomers: parseInt(customersResult.rows[0]?.total_customers || 0), // Frontend expects totalCustomers
        pendingOrders: parseInt(ordersResult.rows[0]?.pending_orders || 0), // Frontend expects pendingOrders
        totalProducts: parseInt(productsResult.rows[0]?.total_products || 0),
        // Newsletter metrics
        totalNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.total_subscribers || 0),
        activeNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.active_subscribers || 0),
        newNewsletterSubscribers: parseInt(newsletterResult.rows[0]?.new_subscribers_this_period || 0),
        // Visitor metrics
        totalVisitors: parseInt(visitorResult.rows[0]?.total_visitors || 0),
        visitorsThisPeriod: parseInt(visitorResult.rows[0]?.visitors_this_period || 0),
        uniqueVisitDays: parseInt(visitorResult.rows[0]?.unique_visit_days || 0),
        // Daily visitor data for chart
        dailyVisitors: dailyVisitorsResult.rows
      },
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows
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

// Update settings
router.put('/settings', async (req, res) => {
  try {
    const {
      store_name,
      contact_email,
      contact_phone,
      exchange_rate_ghs,
      hero_image_url,
      hero_title,
      hero_subtitle,
      hero_button_text
    } = req.body;

    // Check if settings exist
    const existingSettings = await query('SELECT id FROM settings LIMIT 1');
    
    let result;
    if (existingSettings.rows.length === 0) {
      // Create new settings record
      result = await query(
        `INSERT INTO settings (
          store_name, contact_email, contact_phone, exchange_rate_ghs,
          hero_image_url, hero_title, hero_subtitle,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         RETURNING *`,
        [store_name, contact_email, contact_phone, exchange_rate_ghs, hero_image_url, hero_title, hero_subtitle]
      );
    } else {
      // Update existing settings
      result = await query(
        `UPDATE settings SET 
          store_name = COALESCE($1, store_name),
          contact_email = COALESCE($2, contact_email),
          contact_phone = COALESCE($3, contact_phone),
          exchange_rate_ghs = COALESCE($4, exchange_rate_ghs),
          hero_image_url = COALESCE($5, hero_image_url),
          hero_title = COALESCE($6, hero_title),
          hero_subtitle = COALESCE($7, hero_subtitle),
          updated_at = NOW()
        WHERE id = $8 
        RETURNING *`,
        [store_name, contact_email, contact_phone, exchange_rate_ghs, hero_image_url, hero_title, hero_subtitle, existingSettings.rows[0].id]
      );
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// PUT /api/admin/settings - Update settings
router.put('/settings', async (req, res) => {
  try {
    const {
      store_name,
      contact_email,
      contact_phone,
      exchange_rate_ghs,
      hero_image_url,
      hero_title,
      hero_subtitle,
      hero_button_text
    } = req.body;

    // Check if settings exist
    const existingSettings = await query('SELECT id FROM settings LIMIT 1');

    let result;
    if (existingSettings.rows.length === 0) {
      // Create new settings record
      result = await query(
        `INSERT INTO settings (
          store_name, contact_email, contact_phone, exchange_rate_ghs,
          hero_image_url, hero_title, hero_subtitle,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [store_name, contact_email, contact_phone, exchange_rate_ghs, hero_image_url, hero_title, hero_subtitle]
      );
    } else {
      // Update existing settings
      result = await query(
        `UPDATE settings SET
          store_name = COALESCE($1, store_name),
          contact_email = COALESCE($2, contact_email),
          contact_phone = COALESCE($3, contact_phone),
          exchange_rate_ghs = COALESCE($4, exchange_rate_ghs),
          hero_image_url = COALESCE($5, hero_image_url),
          hero_title = COALESCE($6, hero_title),
          hero_subtitle = COALESCE($7, hero_subtitle),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *`,
        [store_name, contact_email, contact_phone, exchange_rate_ghs, hero_image_url, hero_title, hero_subtitle, existingSettings.rows[0].id]
      );
    }

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
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

module.exports = router;