const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const nodemailer = require('nodemailer');
const axios = require('axios');
const router = express.Router();

// Use existing email and SMS systems
const sendEmail = async ({ to, subject, message }) => {
  try {
    console.log(`📧 sendEmail: Attempting to send email to ${to}`);
    
    // Get email settings from database (same as existing email route)
    const settingsResult = await query('SELECT * FROM email_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      console.error('❌ sendEmail: Email settings not configured');
      throw new Error('Email settings not configured');
    }

    const settings = settingsResult.rows[0];
    console.log(`📧 sendEmail: Using SMTP host: ${settings.smtp_host}, from: ${settings.smtp_from_email}`);

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

    console.log(`📧 sendEmail: Sending email with subject: ${subject}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ sendEmail: Email sent successfully. MessageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ sendEmail Error:', error);
    console.error('❌ sendEmail Error Details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw error;
  }
};

const sendSMS = async ({ destination, message, source }) => {
  try {
    // Get SMS settings from database (use ID=1)
    const settingsResult = await query('SELECT * FROM sms_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      throw new Error('SMS settings not configured');
    }

    const settings = settingsResult.rows[0];
    const username = settings.deywuro_username;
    const password = settings.deywuro_password;
    // Always use database source, fallback to 'T-Hands' if not set
    const dbSource = settings.deywuro_source || 'T-Hands';
    
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
      source: dbSource, // Always use database source, never the parameter
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
        
        const smsMessage = `Hi ${customerName}! Your TailoredHands order ${order.order_number} has been placed successfully. Total: GHS ${order.base_total}. We'll update you on the progress. Thank you!`;

        await sendSMS({
          destination: phone,
          message: smsMessage
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
    const phoneNumber = order.shipping_phone || order.customer_phone;
    console.log('📱 Payment Success SMS Check (Backend):', {
      sms_enabled: settings.sms_enabled,
      payment_success_sms: settings.payment_success_sms,
      shipping_phone: order.shipping_phone,
      customer_phone: order.customer_phone,
      phoneNumber: phoneNumber,
      hasPhone: !!phoneNumber
    });

    if (settings.sms_enabled && settings.payment_success_sms && phoneNumber) {
      try {
        const customerName = order.shipping_first_name || order.first_name || 'Customer';
        
        const smsMessage = `Order Confirmed! Your order ${order.order_number} (GHS ${order.base_total}) has been placed and paid successfully. We're preparing it for shipping. Thank you for choosing TailoredHands!`;

        console.log('📱 Sending payment success SMS to:', phoneNumber);
        console.log('📱 SMS Message:', smsMessage);

        await sendSMS({
          destination: phoneNumber,
          message: smsMessage
        });

        console.log('✅ Payment success SMS sent successfully');
        results.sms = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['order_confirmed', phoneNumber, 'sms', 'sent', orderId]);

      } catch (error) {
        console.error('❌ Error sending payment success SMS:', error);
        console.error('❌ SMS Error Details:', {
          message: error.message,
          stack: error.stack,
          phoneNumber: phoneNumber
        });
        results.sms = { success: false, error: error.message };

        // Log failed notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, error_message, order_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['order_confirmed', phoneNumber, 'sms', 'failed', error.message, orderId]);
      }
    } else {
      console.warn('⚠️ SMS not sent - conditions not met:', {
        sms_enabled: settings.sms_enabled,
        payment_success_sms: settings.payment_success_sms,
        hasPhone: !!phoneNumber
      });
      results.sms = { success: false, skipped: true, reason: 'Settings disabled or phone number missing' };
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
          to: consultation.email || consultation.customer_email,
          subject: `Consultation Request Received - ${consultation.consultation_type || consultation.type || 'Consultation'}`,
          message: `
Dear ${consultation.name || consultation.first_name || 'Customer'},

Thank you for your consultation request! We have received your request and will get back to you soon.

Consultation Details:
- Service Type: ${consultation.consultation_type || consultation.type || 'N/A'}
- Preferred Date: ${consultation.preferred_date || 'N/A'}
- Message: ${consultation.message || consultation.additional_instructions || 'N/A'}

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
    const consultationPhone = consultation.phone || consultation.customer_phone;
    if (settings.sms_enabled && consultationPhone) {
      try {
        const consultationName = consultation.name || consultation.first_name || 'Customer';
        const consultationType = consultation.consultation_type || consultation.type || 'consultation';
        const smsMessage = `Hi ${consultationName}! We've received your consultation request for ${consultationType}. We'll contact you within 24 hours to schedule. Thank you for choosing TailoredHands!`;

        await sendSMS({
          destination: consultationPhone,
          message: smsMessage
        });

        results.sms = { success: true };

        // Log notification
        await query(`
          INSERT INTO notification_logs (type, recipient, method, status, consultation_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['consultation_request', consultationPhone, 'sms', 'sent', consultationId]);

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

// Generic email sending endpoint (for frontend use)
router.post('/send/email', async (req, res) => {
  try {
    console.log('📧 Notifications: Sending generic email');

    const { to, subject, message, from_name, template_type, template_data } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Email recipient (to) and subject are required' });
    }

    // Build the email message
    let emailMessage = message || '';
    
    // If template_data is provided, use it to build a formatted message
    if (template_data && Object.keys(template_data).length > 0) {
      // For payment success template
      if (template_type === 'payment-success') {
        emailMessage = `
Dear ${template_data.customer_name || 'Valued Customer'},

🎉 Your payment has been successfully processed!

📋 Order Details:
- Order Number: ${template_data.order_number || 'N/A'}
- Payment Date: ${template_data.payment_date || new Date().toLocaleDateString()}
- Payment Method: ${template_data.payment_method || 'Card Payment'}
- Amount Paid: ${template_data.payment_amount || 'N/A'}
- Transaction ID: ${template_data.transaction_id || 'N/A'}

${template_data.order_items && template_data.order_items.length > 0 ? `
📦 Items Ordered:
${template_data.order_items.map(item => `  • ${item.name}${item.size ? ` (${item.size})` : ''} x ${item.quantity} - ${item.price_display}`).join('\n')}

Order Summary:
  Subtotal: ${template_data.subtotal_display || 'N/A'}
  Shipping: ${template_data.shipping_display || 'N/A'}
  Total: ${template_data.total_display || 'N/A'}
` : ''}

🚚 Estimated Delivery: ${template_data.estimated_delivery_date || 'Within 7-14 business days'}

You can track your order here: ${template_data.order_tracking_url || ''}

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
        `.trim();
      }
      // For order confirmation template  
      else if (template_type === 'order-confirmation') {
        emailMessage = `
Dear ${template_data.customer_name || 'Valued Customer'},

Thank you for your order! We've received your order and it's being processed.

📋 Order Details:
- Order Number: ${template_data.order_number || 'N/A'}
- Order Date: ${template_data.order_date || new Date().toLocaleDateString()}
- Payment Status: ${template_data.payment_status || 'Pending'}

${template_data.order_items && template_data.order_items.length > 0 ? `
📦 Items Ordered:
${template_data.order_items.map(item => `  • ${item.name}${item.size ? ` (${item.size})` : ''} x ${item.quantity} - ${item.price_display}`).join('\n')}

Order Summary:
  Subtotal: ${template_data.subtotal_display || 'N/A'}
  Shipping: ${template_data.shipping_display || 'N/A'}
  Total: ${template_data.total_display || 'N/A'}
` : ''}

📍 Shipping Address:
${template_data.shipping_address || ''}, ${template_data.shipping_city || ''}, ${template_data.shipping_state || ''} ${template_data.shipping_postal_code || ''}, ${template_data.shipping_country || ''}

Track your order: ${template_data.order_tracking_url || ''}

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
        `.trim();
      }
    }

    await sendEmail({
      to: to,
      subject: subject,
      message: emailMessage
    });

    console.log('✅ Email sent successfully to:', to);
    res.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

// Generic SMS sending endpoint (for frontend use)
router.post('/send/sms', async (req, res) => {
  try {
    console.log('📱 Notifications: Sending generic SMS');

    const { destination, message, source } = req.body;

    if (!destination || !message) {
      return res.status(400).json({ error: 'Phone number (destination) and message are required' });
    }

    await sendSMS({
      destination: destination,
      message: message
      // Source is always taken from database settings, not from parameter
    });

    console.log('✅ SMS sent successfully to:', destination);
    res.json({ success: true, message: 'SMS sent successfully' });

  } catch (error) {
    console.error('❌ SMS sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
});

// Helper function to get admin email addresses
const getAdminEmails = async () => {
  try {
    // Try to get from users table first
    let result = await query(`
      SELECT DISTINCT email 
      FROM users 
      WHERE role IN ('super_admin', 'admin', 'manager', 'support')
      AND email IS NOT NULL
      AND email != ''
    `);
    
    let emails = result.rows.map(row => row.email);
    
    // Also check profiles table (for Supabase auth users)
    try {
      const profilesResult = await query(`
        SELECT DISTINCT email 
        FROM profiles 
        WHERE role IN ('super_admin', 'admin', 'manager', 'support')
        AND email IS NOT NULL
        AND email != ''
      `);
      
      const profileEmails = profilesResult.rows.map(row => row.email);
      // Merge and deduplicate
      emails = [...new Set([...emails, ...profileEmails])];
    } catch (profilesError) {
      console.warn('⚠️ Could not query profiles table (may not exist):', profilesError.message);
    }
    
    console.log(`📧 Found ${emails.length} admin email(s):`, emails);
    return emails;
  } catch (error) {
    console.error('❌ Error fetching admin emails:', error);
    return [];
  }
};

// Helper function to send admin order notification (can be called directly or via route)
const sendAdminOrderNotification = async (orderId) => {
  try {
    console.log('📧 Admin Order Notification: Processing order:', orderId);

    // Get order details with items
    const orderResult = await query(`
      SELECT 
        o.*,
        c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone,
        STRING_AGG(
          oi.quantity || 'x ' || COALESCE(p.name, gvt.name, 'Item') || 
          CASE WHEN oi.size IS NOT NULL THEN ' (Size: ' || oi.size || ')' ELSE '' END ||
          ' - $' || (oi.price * oi.quantity)::text,
          E'\n'
        ) as items_summary
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN gift_voucher_types gvt ON oi.gift_voucher_type_id = gvt.id
      WHERE o.id = $1
      GROUP BY o.id, c.id
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];
    console.log('📧 Admin Order Notification: Fetching admin emails...');
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.warn('⚠️ No admin emails found, skipping admin notification');
      return { success: true, message: 'No admin emails configured', sent: 0 };
    }

    const customerName = `${order.shipping_first_name || order.first_name || ''} ${order.shipping_last_name || order.last_name || ''}`.trim() || 'Customer';
    
    const emailBody = `
🛒 NEW ORDER RECEIVED

Order Details:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleString()}
- Customer: ${customerName}
- Email: ${order.shipping_email || order.customer_email || 'N/A'}
- Phone: ${order.shipping_phone || order.customer_phone || 'N/A'}

Payment:
- Status: ${order.payment_status}
- Method: ${order.payment_method || 'N/A'}
- Amount: $${order.base_total || 0}
- Reference: ${order.payment_reference || 'N/A'}

Shipping Address:
${order.shipping_address || 'N/A'}
${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_postal_code || ''}
${order.shipping_country || ''}

Order Items:
${order.items_summary || 'No items found'}

Subtotal: $${order.base_subtotal || 0}
Shipping: $${order.base_shipping || 0}
Total: $${order.base_total || 0}

View full order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders/${order.id}
    `;

    console.log(`📧 Admin Order Notification: Sending to ${adminEmails.length} admin(s):`, adminEmails);

    // Send to all admins
    const emailResults = [];
    for (const email of adminEmails) {
      try {
        console.log(`📧 Sending admin order notification to: ${email}`);
        const result = await sendEmail({
          to: email,
          subject: `🛒 New Order: ${order.order_number}`,
          message: emailBody
        });
        console.log(`✅ Admin order notification sent successfully to ${email}`);
        emailResults.push({ email, success: true, result });
      } catch (err) {
        console.error(`❌ Failed to send admin notification to ${email}:`, err);
        emailResults.push({ email, success: false, error: err.message });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    console.log(`✅ Admin order notification: ${successCount}/${adminEmails.length} sent successfully`);
    return { 
      success: true, 
      message: `Notification sent to ${successCount}/${adminEmails.length} admin(s)`,
      sent: successCount,
      total: adminEmails.length,
      results: emailResults
    };

  } catch (error) {
    console.error('❌ Admin order notification error:', error);
    throw error;
  }
};

// Send admin notification for new order (HTTP route)
router.post('/send/admin/order', async (req, res) => {
  try {
    console.log('📧 Admin Order Notification: Request received', req.body);
    const { orderId } = req.body;
    if (!orderId) {
      console.error('❌ Admin Order Notification: Order ID missing');
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await sendAdminOrderNotification(orderId);
    res.json(result);

  } catch (error) {
    console.error('❌ Admin order notification error:', error);
    res.status(500).json({ error: 'Failed to send admin notification', details: error.message });
  }
});

// Send admin notification for new consultation
router.post('/send/admin/consultation', async (req, res) => {
  try {
    const { consultationId } = req.body;
    if (!consultationId) {
      return res.status(400).json({ error: 'Consultation ID is required' });
    }

    const consultationResult = await query(`
      SELECT * FROM consultations WHERE id = $1
    `, [consultationId]);

    if (consultationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const consultation = consultationResult.rows[0];
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.warn('⚠️ No admin emails found, skipping admin notification');
      return res.json({ success: true, message: 'No admin emails configured' });
    }

    const emailBody = `
📅 NEW CONSULTATION REQUEST

Details:
- Name: ${consultation.name || consultation.first_name || 'N/A'}
- Email: ${consultation.email || 'N/A'}
- Phone: ${consultation.phone || 'N/A'}
- Type: ${consultation.type || 'N/A'}
- Service: ${consultation.consultation_type || consultation.type || 'N/A'}
- Date: ${consultation.preferred_date ? new Date(consultation.preferred_date).toLocaleDateString() : 'N/A'}
- Time: ${consultation.preferred_time || 'N/A'}
- Status: ${consultation.status || 'pending'}

${consultation.message ? `Message:\n${consultation.message}` : ''}

View consultation: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/consultations/${consultation.id}
    `;

    const emailPromises = adminEmails.map(email => 
      sendEmail({
        to: email,
        subject: `📅 New Consultation Request: ${consultation.name || consultation.first_name || 'Customer'}`,
        message: emailBody
      }).catch(err => {
        console.error(`Failed to send admin notification to ${email}:`, err);
        return null;
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Admin consultation notification sent to ${adminEmails.length} admin(s)`);
    res.json({ success: true, message: `Notification sent to ${adminEmails.length} admin(s)` });

  } catch (error) {
    console.error('❌ Admin consultation notification error:', error);
    res.status(500).json({ error: 'Failed to send admin notification', details: error.message });
  }
});

// Send admin notification for new message
router.post('/send/admin/message', async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    const messageResult = await query(`
      SELECT * FROM messages WHERE id = $1
    `, [messageId]);

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.warn('⚠️ No admin emails found, skipping admin notification');
      return res.json({ success: true, message: 'No admin emails configured' });
    }

    const emailBody = `
💬 NEW MESSAGE RECEIVED

From:
- Name: ${message.name || 'N/A'}
- Email: ${message.email || 'N/A'}
- Phone: ${message.phone || 'N/A'}

Message:
${message.message || 'N/A'}

Received: ${new Date(message.created_at).toLocaleString()}

View message: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/messages/${message.id}
    `;

    const emailPromises = adminEmails.map(email => 
      sendEmail({
        to: email,
        subject: `💬 New Message from ${message.name || 'Customer'}`,
        message: emailBody
      }).catch(err => {
        console.error(`Failed to send admin notification to ${email}:`, err);
        return null;
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Admin message notification sent to ${adminEmails.length} admin(s)`);
    res.json({ success: true, message: `Notification sent to ${adminEmails.length} admin(s)` });

  } catch (error) {
    console.error('❌ Admin message notification error:', error);
    res.status(500).json({ error: 'Failed to send admin notification', details: error.message });
  }
});

// Export helper functions for direct use
module.exports = router;
module.exports.sendAdminOrderNotification = sendAdminOrderNotification;
module.exports.getAdminEmails = getAdminEmails;
