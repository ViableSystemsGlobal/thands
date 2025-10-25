const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const nodemailer = require('nodemailer');

// Get email settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM email_settings WHERE id = 1');
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        success: true,
        data: {
          host: '',
          port: 587,
          user: '',
          pass: '',
          from_email: '',
          from_name: '',
          secure: false
        }
      });
    }

    const settings = result.rows[0];
    res.json({
      success: true,
      data: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        user: settings.smtp_username,
        pass: settings.smtp_password,
        from_email: settings.smtp_from_email,
        from_name: settings.smtp_from_name,
        secure: settings.smtp_secure
      }
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ 
          success: false,
      error: 'Failed to fetch email settings' 
    });
  }
});

// Update email settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_secure } = req.body;

    // Check if settings exist
    const existingSettings = await query('SELECT id FROM email_settings WHERE id = 1');
    
    if (existingSettings.rows.length === 0) {
      // Insert new settings
      await query(`
        INSERT INTO email_settings (id, smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_secure)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      `, [smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_secure]);
    } else {
      // Update existing settings
      await query(`
        UPDATE email_settings 
        SET smtp_host = $1, smtp_port = $2, smtp_username = $3, smtp_password = $4, 
            smtp_from_email = $5, smtp_from_name = $6, smtp_secure = $7, updated_at = NOW()
        WHERE id = 1
      `, [smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_secure]);
    }

    res.json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email settings' 
    });
  }
});

// Get email templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, subject, content, created_at, updated_at
      FROM email_templates
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: {
        templates: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email templates' 
    });
  }
});

// Send email
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const {
      subject, 
      content, 
      send_to_all_customers, 
      send_to_newsletter, 
      send_to_selected, 
      selected_customers = [],
      template_id 
    } = req.body;

    // Get email settings
    const settingsResult = await query('SELECT * FROM email_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Email settings not configured'
      });
    }

    const settings = settingsResult.rows[0];

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure, // Use the secure setting from database
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password
      }
    });

    // Get recipients
    let recipients = [];

    if (send_to_all_customers) {
      const customersResult = await query('SELECT email, first_name, last_name FROM customers WHERE email IS NOT NULL');
      recipients.push(...customersResult.rows.map(c => ({ email: c.email, name: `${c.first_name} ${c.last_name}` })));
    }

    if (send_to_newsletter) {
      const newsletterResult = await query('SELECT email FROM newsletter_subscribers WHERE is_active = true');
      recipients.push(...newsletterResult.rows.map(n => ({ email: n.email, name: 'Newsletter Subscriber' })));
    }

    if (send_to_selected && selected_customers.length > 0) {
      const placeholders = selected_customers.map((_, index) => `$${index + 1}`).join(',');
      const selectedResult = await query(`SELECT email, first_name, last_name FROM customers WHERE id IN (${placeholders})`, selected_customers);
      recipients.push(...selectedResult.rows.map(c => ({ email: c.email, name: `${c.first_name} ${c.last_name}` })));
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter((recipient, index, self) => 
      index === self.findIndex(r => r.email === recipient.email)
    );

    if (uniqueRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No recipients found'
      });
    }

    // Send emails
    const emailPromises = uniqueRecipients.map(recipient => {
      return transporter.sendMail({
        from: `"${settings.smtp_from_name}" <${settings.smtp_from_email}>`,
        to: recipient.email,
        subject: subject,
        html: content
      });
    });

    await Promise.all(emailPromises);

    // Log email send
    await query(`
      INSERT INTO email_logs (subject, recipient_count, sent_at, sent_by)
      VALUES ($1, $2, NOW(), $3)
    `, [subject, uniqueRecipients.length, req.user.id]);

    res.json({
      success: true,
      message: `Email sent successfully to ${uniqueRecipients.length} recipients`,
      recipient_count: uniqueRecipients.length
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email: ' + error.message 
    });
  }
});

// Get email logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT el.*, u.email as sent_by_email
      FROM email_logs el
      LEFT JOIN users u ON el.sent_by = u.id
      ORDER BY el.sent_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query('SELECT COUNT(*) as total FROM email_logs');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email logs' 
    });
  }
});

// Test email configuration
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { test_email } = req.body;

    // Get email settings
    const settingsResult = await query('SELECT * FROM email_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Email settings not configured'
      });
    }

    const settings = settingsResult.rows[0];

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure, // Use the secure setting from database
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password
      }
    });

    // Send test email
    await transporter.sendMail({
      from: `"${settings.smtp_from_name}" <${settings.smtp_from_email}>`,
      to: test_email,
      subject: 'Test Email from TailoredHands',
      html: '<p>This is a test email to verify your SMTP configuration.</p><p>If you receive this email, your settings are working correctly!</p>'
    });

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email: ' + error.message 
    });
  }
});

// Get email template
router.get('/template', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM email_template_settings WHERE id = 1');
    
    if (result.rows.length === 0) {
      // Return default template if none exist
      return res.json({
        success: true,
        template: {
          header_html: '',
          footer_html: '',
          body_styles: '',
          primary_color: '#D2B48C',
          secondary_color: '#f8f9fa',
          font_family: 'Arial, sans-serif'
        }
      });
    }

    const template = result.rows[0];
    res.json({
      success: true,
      template: {
        header_html: template.header_html || '',
        footer_html: template.footer_html || '',
        body_styles: template.body_styles || '',
        primary_color: template.primary_color || '#D2B48C',
        secondary_color: template.secondary_color || '#f8f9fa',
        font_family: template.font_family || 'Arial, sans-serif'
      }
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch email template' 
    });
  }
});

// Update email template
router.put('/template', authenticateToken, async (req, res) => {
  try {
    const { header_html, footer_html, body_styles, primary_color, secondary_color, font_family } = req.body;

    // Check if template exists
    const existingTemplate = await query('SELECT id FROM email_template_settings WHERE id = 1');
    
    if (existingTemplate.rows.length === 0) {
      // Create new template
      await query(`
        INSERT INTO email_template_settings (id, header_html, footer_html, body_styles, primary_color, secondary_color, font_family, created_at, updated_at)
        VALUES (1, $1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [header_html, footer_html, body_styles, primary_color, secondary_color, font_family]);
    } else {
      // Update existing template
      await query(`
        UPDATE email_template_settings 
        SET header_html = $1, footer_html = $2, body_styles = $3, primary_color = $4, secondary_color = $5, font_family = $6, updated_at = NOW()
        WHERE id = 1
      `, [header_html, footer_html, body_styles, primary_color, secondary_color, font_family]);
    }

    res.json({
      success: true,
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update email template' 
    });
  }
});

module.exports = router;