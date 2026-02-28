const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Deywuro SMS API Configuration
const DEYWURO_CONFIG = {
  apiUrl: 'https://deywuro.com/api/sms',
  // These should be stored in environment variables
  defaultUsername: process.env.DEYWURO_USERNAME || '',
  defaultPassword: process.env.DEYWURO_PASSWORD || '',
  defaultSource: 'T-Hands'
};

/**
 * Send SMS using Deywuro API
 * @param {Object} smsData - SMS data object
 * @returns {Promise<Object>} API response
 */
const sendSMSViaDeywuro = async (smsData) => {
  try {
    const {
      username = DEYWURO_CONFIG.defaultUsername,
      password = DEYWURO_CONFIG.defaultPassword,
      destination,
      source = DEYWURO_CONFIG.defaultSource,
      message
    } = smsData;

    // Validate required fields
    if (!destination || !message) {
      throw new Error('Destination and message are required');
    }

    if (!username || !password) {
      throw new Error('Deywuro credentials are required');
    }

    // Format phone numbers (ensure they start with country code)
    const formattedDestinations = destination
      .split(',')
      .map(phone => phone.trim())
      .map(phone => {
        // Add Ghana country code if not present
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

    console.log('📱 SMS Backend: Sending SMS via Deywuro API');
    console.log('📱 SMS Backend: Destinations:', formattedDestinations);
    console.log('📱 SMS Backend: Source:', source);
    console.log('📱 SMS Backend: Message length:', message.length);

    // Make API request to Deywuro
    const response = await fetch(DEYWURO_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        destination: formattedDestinations,
        source,
        message
      })
    });

    const result = await response.json();
    
    console.log('📱 SMS Backend: Deywuro API Response:', result);

    // Handle Deywuro response codes
    switch (result.code) {
      case 0:
        return {
          success: true,
          message: result.message,
          code: result.code
        };
      case 401:
        throw new Error('Invalid Deywuro credentials');
      case 403:
        throw new Error('Insufficient Deywuro balance');
      case 404:
        throw new Error('Phone number not routable');
      case 402:
        throw new Error('Missing required fields');
      case 500:
        throw new Error('Deywuro service error');
      default:
        throw new Error(result.message || 'Unknown SMS error');
    }

  } catch (error) {
    console.error('📱 SMS Backend Error:', error);
    throw error;
  }
};

// Test SMS endpoint (admin only)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Test: Testing SMS configuration');

    const adminRoles = ['super_admin', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { destination, message = 'Test SMS from TailoredHands' } = req.body;

    if (!destination) {
      return res.status(400).json({
        error: 'Destination phone number is required'
      });
    }

    // Use DB credentials for testing
    const settingsResult = await query('SELECT * FROM sms_settings WHERE id = 1');
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].deywuro_username) {
      return res.status(400).json({ error: 'SMS settings not configured' });
    }
    const settings = settingsResult.rows[0];

    const testSmsData = {
      destination,
      message,
      source: settings.deywuro_source || DEYWURO_CONFIG.defaultSource,
      username: settings.deywuro_username,
      password: settings.deywuro_password
    };

    const result = await sendSMSViaDeywuro(testSmsData);

    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      result
    });

  } catch (error) {
    console.error('📱 SMS Test Error:', error);
    res.status(500).json({
      error: 'Failed to send test SMS',
      details: error.message
    });
  }
});

// Send SMS endpoint (Admin only)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Send: Request received');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      console.log('❌ SMS Send: Admin access required');
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('✅ SMS Send: Admin access confirmed');

    const { destination, message, source } = req.body;

    if (!destination || !message) {
      return res.status(400).json({ 
        error: 'Destination and message are required' 
      });
    }

    // Get SMS settings from database
    const settingsResult = await query('SELECT * FROM sms_settings WHERE id = 1');
    
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].deywuro_username || !settingsResult.rows[0].deywuro_password) {
      return res.status(400).json({ 
        error: 'SMS settings not configured. Please configure SMS settings first.' 
      });
    }

    const settings = settingsResult.rows[0];

    // Use database credentials
    const smsData = {
      destination,
      message,
      source: settings.deywuro_source || 'T-Hands', // Always use database source
      username: settings.deywuro_username,
      password: settings.deywuro_password
    };

    console.log('📱 SMS Send: Sending SMS...', {
      destination: smsData.destination,
      source: smsData.source,
      messageLength: smsData.message.length
    });

    const result = await sendSMSViaDeywuro(smsData);

    // Log SMS activity
    console.log('📱 SMS Send: SMS sent successfully', {
      destination: smsData.destination,
      recipients: smsData.destination.split(',').length,
      messageLength: smsData.message.length,
      result: result.message
    });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      result
    });

  } catch (error) {
    console.error('📱 SMS Send Error:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
});

// Get SMS configuration status
router.get('/config', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Config: Request received');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const hasCredentials = !!(DEYWURO_CONFIG.defaultUsername && DEYWURO_CONFIG.defaultPassword);
    
    res.json({
      configured: hasCredentials,
      apiUrl: DEYWURO_CONFIG.apiUrl,
      source: DEYWURO_CONFIG.defaultSource,
      hasCredentials
    });

  } catch (error) {
    console.error('📱 SMS Config Error:', error);
    res.status(500).json({ 
      error: 'Failed to get SMS configuration', 
      details: error.message 
    });
  }
});

// Bulk SMS endpoint
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Bulk: Request received');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { recipients, message, source } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        error: 'Recipients array is required' 
      });
    }

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Format recipients as comma-separated string
    const destination = recipients.join(',');
    
    // Get SMS settings from database
    const settingsResult = await query('SELECT * FROM sms_settings WHERE id = 1');
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].deywuro_username) {
      return res.status(400).json({ error: 'SMS settings not configured. Please configure SMS settings first.' });
    }
    const smsSettings = settingsResult.rows[0];

    const smsData = {
      destination,
      message,
      source: source || smsSettings.deywuro_source || DEYWURO_CONFIG.defaultSource,
      username: smsSettings.deywuro_username,
      password: smsSettings.deywuro_password
    };

    console.log('📱 SMS Bulk: Sending bulk SMS...', {
      recipientCount: recipients.length,
      messageLength: message.length
    });

    const result = await sendSMSViaDeywuro(smsData);

    console.log('📱 SMS Bulk: Bulk SMS sent successfully', {
      recipientCount: recipients.length,
      result: result.message
    });

    res.json({
      success: true,
      message: 'Bulk SMS sent successfully',
      recipientCount: recipients.length,
      result
    });

  } catch (error) {
    console.error('📱 SMS Bulk Error:', error);
    res.status(500).json({ 
      error: 'Failed to send bulk SMS', 
      details: error.message 
    });
  }
});

// Save SMS settings to database (super_admin / admin only)
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Settings: Saving settings');

    const adminRoles = ['super_admin', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { deywuro_username, deywuro_password, deywuro_source } = req.body;

    if (!deywuro_username || !deywuro_password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // First try to update existing record, then insert if none exists
    let result;
    try {
      // Try to update the first record (ID=1)
      result = await query(`
        UPDATE sms_settings 
        SET deywuro_username = $1, deywuro_password = $2, deywuro_source = $3, updated_at = NOW()
        WHERE id = 1
        RETURNING *
      `, [deywuro_username, deywuro_password, deywuro_source || 'T-Hands']);
      
      if (result.rows.length === 0) {
        // No record with ID=1 exists, create it
        result = await query(`
          INSERT INTO sms_settings (id, deywuro_username, deywuro_password, deywuro_source, created_at, updated_at)
          VALUES (1, $1, $2, $3, NOW(), NOW())
          RETURNING *
        `, [deywuro_username, deywuro_password, deywuro_source || 'T-Hands']);
      }
    } catch (error) {
      // If there's an error, create a new record
      result = await query(`
        INSERT INTO sms_settings (deywuro_username, deywuro_password, deywuro_source, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [deywuro_username, deywuro_password, deywuro_source || 'T-Hands']);
    }

    console.log('✅ SMS Settings: Settings saved successfully');
    res.json({ success: true, message: 'SMS settings saved successfully' });

  } catch (error) {
    console.error('❌ SMS Settings Error:', error);
    res.status(500).json({ error: 'Failed to save SMS settings', details: error.message });
  }
});

// Get SMS settings from database (super_admin / admin only)
// Password is masked in the response — never returned in plaintext
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('📱 SMS Settings: Getting settings');

    const adminRoles = ['super_admin', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query('SELECT * FROM sms_settings WHERE id = 1');

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          deywuro_username: '',
          deywuro_password: '',
          deywuro_source: 'T-Hands',
          has_password: false
        }
      });
    }

    const settings = result.rows[0];
    res.json({
      success: true,
      data: {
        deywuro_username: settings.deywuro_username,
        // Never return the actual password — client shows a masked placeholder
        deywuro_password: settings.deywuro_password ? '••••••••' : '',
        deywuro_source: settings.deywuro_source,
        has_password: !!settings.deywuro_password
      }
    });

  } catch (error) {
    console.error('❌ SMS Settings Error:', error);
    res.status(500).json({ error: 'Failed to get SMS settings', details: error.message });
  }
});

module.exports = router;
