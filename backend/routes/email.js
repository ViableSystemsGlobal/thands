const express = require('express');
const nodemailer = require('nodemailer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Create SMTP transporter
const createTransporter = (config) => {
  return nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port == 465, // true for 465, false for other ports
    auth: {
      user: config.smtp_username,
      pass: config.smtp_password,
    },
    tls: {
      rejectUnauthorized: false // For development, remove in production
    }
  });
};

// Email templates
const emailTemplates = {
  order_confirmation: {
    subject: 'Order Confirmation - {{order_number}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Confirmation</h1>
            <p>Thank you for your order, {{customer_name}}!</p>
          </div>
          <div class="content">
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> {{order_number}}</p>
              <p><strong>Order Date:</strong> {{order_date}}</p>
              <p><strong>Total Amount:</strong> {{total_amount}}</p>
              <p><strong>Payment Status:</strong> {{payment_status}}</p>
            </div>
            <p>{{message}}</p>
            <p>We'll send you another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The TailoredHands Team</p>
            <p><a href="mailto:support@tailoredhands.africa">support@tailoredhands.africa</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Confirmation - {{order_number}}
      
      Thank you for your order, {{customer_name}}!
      
      Order Details:
      - Order Number: {{order_number}}
      - Order Date: {{order_date}}
      - Total Amount: {{total_amount}}
      - Payment Status: {{payment_status}}
      
      {{message}}
      
      We'll send you another email when your order ships.
      
      Best regards,
      The TailoredHands Team
      support@tailoredhands.africa
    `
  },
  
  general: {
    subject: '{{subject}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>{{subject}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Message from TailoredHands</h1>
          </div>
          <div class="content">
            <p>{{message}}</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The TailoredHands Team</p>
            <p><a href="mailto:support@tailoredhands.africa">support@tailoredhands.africa</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `{{subject}}\n\n{{message}}\n\nBest regards,\nThe TailoredHands Team\nsupport@tailoredhands.africa`
  }
};

// Template rendering function
const renderTemplate = (template, variables) => {
  let html = template.html;
  let text = template.text;
  let subject = template.subject;

  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    html = html.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    text = text.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    subject = subject.replace(new RegExp(placeholder, 'g'), variables[key] || '');
  });

  return { html, text, subject };
};

// Send email endpoint (authenticated users can send emails)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const {
      to,
      subject,
      message,
      template_type = 'general',
      template_data = {},
      smtp_config
    } = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, message'
      });
    }

    // Get SMTP config from database or request
    let emailConfig;
    if (smtp_config) {
      // Use provided config (for testing)
      emailConfig = smtp_config;
    } else {
      // Get from database
      const result = await query(
        'SELECT * FROM email_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No email configuration found. Please configure SMTP settings.'
        });
      }
      
      emailConfig = result.rows[0];
    }

    // Validate SMTP config
    if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMTP configuration'
      });
    }

    // Create transporter
    const transporter = createTransporter(emailConfig);

    // Get template
    const template = emailTemplates[template_type] || emailTemplates.general;
    
    // Prepare template variables
    const variables = {
      customer_name: template_data.customer_name || 'Valued Customer',
      order_number: template_data.order_number || '',
      order_date: template_data.order_date || new Date().toLocaleDateString(),
      total_amount: template_data.total_amount || '',
      payment_status: template_data.payment_status || '',
      subject: subject,
      message: message,
      ...template_data
    };

    // Render template
    const { html, text, subject: renderedSubject } = renderTemplate(template, variables);

    // Email options
    const mailOptions = {
      from: `${emailConfig.from_name || 'TailoredHands'} <${emailConfig.from_email}>`,
      to: to,
      subject: renderedSubject,
      html: html,
      text: text,
      replyTo: emailConfig.reply_to_email || emailConfig.from_email
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log email (optional - save to database)
    try {
      await query(
        `INSERT INTO email_logs (to_email, subject, template_type, status, message_id, sent_at, sent_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          to,
          renderedSubject,
          template_type,
          'sent',
          info.messageId,
          new Date(),
          req.user.id
        ]
      );
    } catch (logError) {
      console.warn('Failed to log email:', logError.message);
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      template_type: template_type,
      service: 'SMTP',
      host: emailConfig.smtp_host
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Log failed email
    try {
      await query(
        `INSERT INTO email_logs (to_email, subject, template_type, status, error_message, sent_at, sent_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.body.to,
          req.body.subject,
          req.body.template_type || 'general',
          'failed',
          error.message,
          new Date(),
          req.user.id
        ]
      );
    } catch (logError) {
      console.warn('Failed to log email error:', logError.message);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email with provided SMTP config (for regular users)
router.post('/test-config', authenticateToken, async (req, res) => {
  try {
    const { smtp_config, test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }

    if (!smtp_config || !smtp_config.smtp_host || !smtp_config.smtp_username || !smtp_config.smtp_password) {
      return res.status(400).json({
        success: false,
        error: 'SMTP configuration is required'
      });
    }

    // Create transporter and send test email
    const transporter = createTransporter(smtp_config);

    const mailOptions = {
      from: `${smtp_config.from_name || 'TailoredHands'} <${smtp_config.from_email}>`,
      to: test_email,
      subject: 'Test Email from TailoredHands',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${smtp_config.smtp_host}</li>
            <li>SMTP Port: ${smtp_config.smtp_port || 587}</li>
            <li>From Email: ${smtp_config.from_email}</li>
            <li>From Name: ${smtp_config.from_name || 'TailoredHands'}</li>
          </ul>
          <p>If you received this email, your SMTP configuration is working perfectly! 🎉</p>
          <hr>
          <p><em>Sent at: ${new Date().toLocaleString()}</em></p>
        </div>
      `,
      text: `Test Email from TailoredHands\n\nThis is a test email to verify your SMTP configuration is working correctly.\n\nIf you received this email, your SMTP configuration is working perfectly!\n\nSent at: ${new Date().toLocaleString()}`
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      testEmail: test_email
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Configure SMTP settings (admin only)
router.post('/config', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      from_email,
      from_name,
      reply_to_email,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!smtp_host || !smtp_username || !smtp_password || !from_email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required SMTP configuration fields'
      });
    }

    // Deactivate existing configs
    await query('UPDATE email_config SET is_active = false');

    // Insert new config
    const result = await query(
      `INSERT INTO email_config (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, reply_to_email, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        smtp_host,
        smtp_port || 587,
        smtp_username,
        smtp_password,
        from_email,
        from_name || 'TailoredHands',
        reply_to_email,
        is_active,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Email configuration updated successfully',
      config: {
        id: result.rows[0].id,
        smtp_host: result.rows[0].smtp_host,
        smtp_port: result.rows[0].smtp_port,
        from_email: result.rows[0].from_email,
        from_name: result.rows[0].from_name,
        is_active: result.rows[0].is_active
      }
    });

  } catch (error) {
    console.error('Email config error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current email configuration (admin only)
router.get('/config', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const result = await query(
      'SELECT id, smtp_host, smtp_port, from_email, from_name, reply_to_email, is_active, created_at FROM email_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        config: null,
        message: 'No email configuration found'
      });
    }

    // Don't return password for security
    const config = result.rows[0];
    delete config.smtp_password;

    res.json({
      success: true,
      config: config
    });

  } catch (error) {
    console.error('Get email config error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email configuration (admin only)
router.post('/test', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { smtp_config, test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }

    // Use provided config or get from database
    let emailConfig = smtp_config;
    if (!emailConfig) {
      const result = await query(
        'SELECT * FROM email_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No email configuration found'
        });
      }
      
      emailConfig = result.rows[0];
    }

    // Create transporter and send test email
    const transporter = createTransporter(emailConfig);

    const mailOptions = {
      from: `${emailConfig.from_name || 'TailoredHands'} <${emailConfig.from_email}>`,
      to: test_email,
      subject: 'Test Email from TailoredHands',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${emailConfig.smtp_host}</li>
            <li>SMTP Port: ${emailConfig.smtp_port || 587}</li>
            <li>From Email: ${emailConfig.from_email}</li>
            <li>From Name: ${emailConfig.from_name || 'TailoredHands'}</li>
          </ul>
          <p>If you received this email, your SMTP configuration is working perfectly! 🎉</p>
          <hr>
          <p><em>Sent at: ${new Date().toLocaleString()}</em></p>
        </div>
      `,
      text: `Test Email from TailoredHands\n\nThis is a test email to verify your SMTP configuration is working correctly.\n\nIf you received this email, your SMTP configuration is working perfectly!\n\nSent at: ${new Date().toLocaleString()}`
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      testEmail: test_email
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email logs (admin only)
router.get('/logs', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = 'SELECT * FROM email_logs';
    let params = [];
    let paramCount = 0;

    if (status) {
      queryStr += ` WHERE status = $${++paramCount}`;
      params.push(status);
    }

    queryStr += ` ORDER BY sent_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM email_logs';
    let countParams = [];
    let countParamCount = 0;

    if (status) {
      countQuery += ` WHERE status = $${++countParamCount}`;
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;