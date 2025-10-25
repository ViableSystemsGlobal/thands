const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const nodemailer = require('nodemailer');
const axios = require('axios');
const router = express.Router();

// Use existing email and SMS systems
const sendEmail = async ({ to, subject, message }) => {
  try {
    // Get email settings from database (same as existing email route)
    const settingsResult = await query('SELECT * FROM email_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      throw new Error('Email settings not configured');
    }

    const settings = settingsResult.rows[0];

    // Create transporter using existing settings
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password
      }
    });

    const mailOptions = {
      from: `${settings.smtp_from_name} <${settings.smtp_from_email}>`,
      to: to,
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Email Error:', error);
    throw error;
  }
};

const sendSMS = async ({ destination, message, source = 'TailoredHands' }) => {
  try {
    // Get SMS settings from database (use ID=1)
    const settingsResult = await query('SELECT * FROM sms_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      throw new Error('SMS settings not configured');
    }

    const settings = settingsResult.rows[0];
    const username = settings.deywuro_username;
    const password = settings.deywuro_password;
    const dbSource = settings.deywuro_source;
    
    if (!username || !password) {
      throw new Error('Deywuro SMS credentials not configured in database');
    }

    // Format phone numbers (same logic as existing SMS route)
    const formattedDestinations = destination
      .split(',')
      .map(phone => phone.trim())
      .map(phone => {
        if (phone.startsWith('0')) {
          return '233' + phone.substring(1);
        } else if (phone.startsWith('+233')) {
          return phone.substring(1);
        } else if (!phone.startsWith('233')) {
          return '233' + phone;
        }
        return phone;
      })
      .join(',');

    const params = new URLSearchParams({
      username,
      password,
      destination: formattedDestinations,
      source: dbSource, // Use database source instead of parameter
      message
    }).toString();

    const response = await axios.get(`https://deywuro.com/api/sms?${params}`);
    
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to send SMS');
    }
    
    return response.data;
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};

// Get notification settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('📧 Notifications: Getting settings');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get notification settings from database
    const settingsResult = await query('SELECT * FROM notification_settings LIMIT 1');
    
    if (settingsResult.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        email_enabled: true,
        sms_enabled: true,
        order_confirmation_email: true,
        order_confirmation_sms: true,
        payment_success_email: true,
        payment_success_sms: true,
        order_shipped_email: true,
        order_shipped_sms: true,
        order_delivered_email: true,
        order_delivered_sms: false,
        gift_voucher_email: true,
        gift_voucher_sms: false
      };

      await query(`
        INSERT INTO notification_settings (
          email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
          payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
          order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        defaultSettings.email_enabled, defaultSettings.sms_enabled,
        defaultSettings.order_confirmation_email, defaultSettings.order_confirmation_sms,
        defaultSettings.payment_success_email, defaultSettings.payment_success_sms,
        defaultSettings.order_shipped_email, defaultSettings.order_shipped_sms,
        defaultSettings.order_delivered_email, defaultSettings.order_delivered_sms,
        defaultSettings.gift_voucher_email, defaultSettings.gift_voucher_sms
      ]);

      res.json(defaultSettings);
    } else {
      res.json(settingsResult.rows[0]);
    }

  } catch (error) {
    console.error('❌ Notifications Settings Error:', error);
    res.status(500).json({ error: 'Failed to get notification settings', details: error.message });
  }
});

// Save notification settings
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('📧 Notifications: Saving settings');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      email_enabled,
      sms_enabled,
      order_confirmation_email,
      order_confirmation_sms,
      payment_success_email,
      payment_success_sms,
      order_shipped_email,
      order_shipped_sms,
      order_delivered_email,
      order_delivered_sms,
      gift_voucher_email,
      gift_voucher_sms
    } = req.body;

    // Check if settings exist
    const existingSettings = await query('SELECT id FROM notification_settings LIMIT 1');

    if (existingSettings.rows.length > 0) {
      // Update existing settings
      await query(`
        UPDATE notification_settings SET
          email_enabled = $1,
          sms_enabled = $2,
          order_confirmation_email = $3,
          order_confirmation_sms = $4,
          payment_success_email = $5,
          payment_success_sms = $6,
          order_shipped_email = $7,
          order_shipped_sms = $8,
          order_delivered_email = $9,
          order_delivered_sms = $10,
          gift_voucher_email = $11,
          gift_voucher_sms = $12,
          updated_at = NOW()
        WHERE id = $13
      `, [
        email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
        payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
        order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms,
        existingSettings.rows[0].id
      ]);
    } else {
      // Insert new settings
      await query(`
        INSERT INTO notification_settings (
          email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
          payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
          order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
        payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
        order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms
      ]);
    }

    console.log('✅ Notifications: Settings saved successfully');
    res.json({ success: true, message: 'Notification settings saved successfully' });

  } catch (error) {
    console.error('❌ Notifications Save Error:', error);
    res.status(500).json({ error: 'Failed to save notification settings', details: error.message });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📧 Notifications: Getting stats');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeframe = '30' } = req.query;
    const days = parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get notification logs
    const logsResult = await query(`
      SELECT type, method, status, created_at
      FROM notification_logs
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [startDate.toISOString()]);

    const logs = logsResult.rows;
    const total = logs.length;
    const successful = logs.filter(log => log.status === 'sent').length;
    const failed = logs.filter(log => log.status === 'failed').length;

    // Group by type and method
    const byType = {};
    const byMethod = {};

    logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      byMethod[log.method] = (byMethod[log.method] || 0) + 1;
    });

    const stats = {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      byType,
      byMethod
    };

    console.log('✅ Notifications: Stats retrieved:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Notifications Stats Error:', error);
    res.status(500).json({ error: 'Failed to get notification statistics', details: error.message });
  }
});

// Send order confirmation notification
router.post('/send/order-confirmation', async (req, res) => {
  try {
    console.log('📧 Notifications: Sending order confirmation');

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order data with customer info
    const orderResult = await query(`
      SELECT 
        o.*,
        c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get notification settings
    const settingsResult = await query('SELECT * FROM notification_settings LIMIT 1');
    const settings = settingsResult.rows[0] || {};

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled && settings.order_confirmation_email) {
      try {
        const emailData = {
          to: order.shipping_email || order.customer_email,
          subject: `Order Confirmation - ${order.order_number}`,
          message: `
Dear ${order.shipping_first_name || order.first_name},

Thank you for your order! Your order has been successfully placed and is being processed.

Order Details:
- Order Number: ${order.order_number}
- Total Amount: GH₵${order.base_total}
- Payment Status: ${order.payment_status}

We'll send you another email once your order ships.

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
          `
        };

        await sendEmail(emailData);
        results.email = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['order_confirmation', emailData.to, 'email', 'sent', orderId]);

      } catch (error) {
        console.error('Error sending order confirmation email:', error);
        results.email = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['order_confirmation', order.shipping_email, 'email', 'failed', error.message, orderId]);
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.order_confirmation_sms && (order.shipping_phone || order.customer_phone)) {
      try {
        const phone = order.shipping_phone || order.customer_phone;
        const customerName = order.shipping_first_name || order.first_name || 'Customer';
        
        const smsMessage = `Hi ${customerName}! Your TailoredHands order ${order.order_number} has been placed successfully. Total: GH₵${order.base_total}. We'll update you on the progress. Thank you!`;

        await sendSMS({
          destination: phone,
          message: smsMessage,
          source: 'TailoredHands'
        });

        results.sms = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['order_confirmation', phone, 'sms', 'sent', orderId]);

      } catch (error) {
        console.error('Error sending order confirmation SMS:', error);
        results.sms = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['order_confirmation', order.shipping_phone, 'sms', 'failed', error.message, orderId]);
      }
    }

    console.log('✅ Notifications: Order confirmation sent:', results);
    res.json({ success: true, results });

  } catch (error) {
    console.error('❌ Notifications Order Confirmation Error:', error);
    res.status(500).json({ error: 'Failed to send order confirmation', details: error.message });
  }
});

// Send payment success notification
router.post('/send/payment-success', async (req, res) => {
  try {
    console.log('📧 Notifications: Sending payment success');

    const { orderId, paymentData } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order data
    const orderResult = await query(`
      SELECT 
        o.*,
        c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get notification settings
    const settingsResult = await query('SELECT * FROM notification_settings LIMIT 1');
    const settings = settingsResult.rows[0] || {};

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled && settings.payment_success_email) {
      try {
        const emailData = {
          to: order.shipping_email || order.customer_email,
          subject: `Order Confirmed & Payment Successful - ${order.order_number}`,
          message: `
Dear ${order.shipping_first_name || order.first_name},

🎉 Congratulations! Your order has been confirmed and payment processed successfully.

📋 Order Details:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleDateString()}
- Total Amount: GH₵${order.base_total}
- Payment Status: ✅ Paid
- Payment Reference: ${paymentData?.reference || 'N/A'}
- Payment Method: ${order.payment_method || 'Paystack'}

🚚 What's Next:
Your order is now being prepared for shipping. We'll send you tracking information once it's dispatched.

📞 Need Help?
If you have any questions about your order, please contact us with your order number: ${order.order_number}

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
          `
        };

        await sendEmail(emailData);
        results.email = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['order_confirmed', emailData.to, 'email', 'sent', orderId]);

      } catch (error) {
        console.error('Error sending payment success email:', error);
        results.email = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['order_confirmed', order.shipping_email, 'email', 'failed', error.message, orderId]);
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.payment_success_sms && (order.shipping_phone || order.customer_phone)) {
      try {
        const phone = order.shipping_phone || order.customer_phone;
        const customerName = order.shipping_first_name || order.first_name || 'Customer';
        
        const smsMessage = `Order Confirmed! Your order ${order.order_number} (GHS ${order.base_total}) has been placed and paid successfully. We're preparing it for shipping. Thank you for choosing TailoredHands!`;

        await sendSMS({
          destination: phone,
          message: smsMessage,
          source: 'TailoredHands'
        });

        results.sms = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['order_confirmed', phone, 'sms', 'sent', orderId]);

      } catch (error) {
        console.error('Error sending payment success SMS:', error);
        results.sms = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['order_confirmed', order.shipping_phone, 'sms', 'failed', error.message, orderId]);
      }
    }

    console.log('✅ Notifications: Order confirmed & payment successful sent:', results);
    res.json({ success: true, results });

  } catch (error) {
    console.error('❌ Notifications Payment Success Error:', error);
    res.status(500).json({ error: 'Failed to send payment success notification', details: error.message });
  }
});

// Send consultation notification
router.post('/send/consultation', async (req, res) => {
  try {
    console.log('📧 Notifications: Sending consultation notification');

    const { consultationId } = req.body;

    if (!consultationId) {
      return res.status(400).json({ error: 'Consultation ID is required' });
    }

    // Get consultation data
    const consultationResult = await query(`
      SELECT 
        c.*,
        cu.first_name, cu.last_name, cu.email as customer_email, cu.phone as customer_phone
      FROM consultations c
      LEFT JOIN customers cu ON c.customer_id = cu.id
      WHERE c.id = $1
    `, [consultationId]);

    if (consultationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const consultation = consultationResult.rows[0];

    // Get notification settings
    const settingsResult = await query('SELECT * FROM notification_settings LIMIT 1');
    const settings = settingsResult.rows[0] || {};

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled) {
      try {
        const emailData = {
          to: consultation.customer_email,
          subject: `Consultation Request Received - ${consultation.service_type}`,
          message: `
Dear ${consultation.first_name},

Thank you for your consultation request! We have received your request and will get back to you soon.

Consultation Details:
- Service Type: ${consultation.service_type}
- Preferred Date: ${consultation.preferred_date}
- Message: ${consultation.message}

We'll review your request and contact you within 24 hours to schedule your consultation.

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
          `
        };

        await sendEmail(emailData);
        results.email = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, consultation_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['consultation_request', emailData.to, 'email', 'sent', consultationId]);

      } catch (error) {
        console.error('Error sending consultation email:', error);
        results.email = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, consultation_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['consultation_request', consultation.customer_email, 'email', 'failed', error.message, consultationId]);
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && consultation.customer_phone) {
      try {
        const smsMessage = `Hi ${consultation.first_name}! We've received your consultation request for ${consultation.service_type}. We'll contact you within 24 hours to schedule. Thank you for choosing TailoredHands!`;

        await sendSMS({
          destination: consultation.customer_phone,
          message: smsMessage,
          source: 'TailoredHands'
        });

        results.sms = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, consultation_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['consultation_request', consultation.customer_phone, 'sms', 'sent', consultationId]);

      } catch (error) {
        console.error('Error sending consultation SMS:', error);
        results.sms = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, consultation_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['consultation_request', consultation.customer_phone, 'sms', 'failed', error.message, consultationId]);
      }
    }

    console.log('✅ Notifications: Consultation notification sent:', results);
    res.json({ success: true, results });

  } catch (error) {
    console.error('❌ Notifications Consultation Error:', error);
    res.status(500).json({ error: 'Failed to send consultation notification', details: error.message });
  }
});

module.exports = router;
