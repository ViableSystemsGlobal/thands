const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * Get shipping settings (DHL)
 * GET /api/shipping-settings/settings
 */
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query(`
      SELECT 
        dhl_api_key,
        dhl_api_secret,
        dhl_account_number,
        dhl_base_url,
        dhl_from_name,
        dhl_from_street,
        dhl_from_city,
        dhl_from_state,
        dhl_from_zip,
        dhl_from_country
      FROM settings 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          dhl_api_key: '',
          dhl_api_secret: '',
          dhl_account_number: '',
          dhl_base_url: 'https://express.api.dhl.com/mydhlapi/test',
          dhl_from_name: 'TailoredHands',
          dhl_from_street: '123 Business Street',
          dhl_from_city: 'Accra',
          dhl_from_state: 'Greater Accra',
          dhl_from_zip: '00233',
          dhl_from_country: 'GH'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting shipping settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get shipping settings' 
    });
  }
});

/**
 * Update shipping settings (DHL)
 * PUT /api/shipping-settings/settings
 */
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      dhl_api_key,
      dhl_api_secret,
      dhl_account_number,
      dhl_base_url,
      dhl_from_name,
      dhl_from_street,
      dhl_from_city,
      dhl_from_state,
      dhl_from_zip,
      dhl_from_country
    } = req.body;

    // Check if settings record exists
    const existingResult = await query('SELECT id FROM settings LIMIT 1');
    
    if (existingResult.rows.length === 0) {
      // Create new settings record
      await query(`
        INSERT INTO settings (
          dhl_api_key,
          dhl_api_secret,
          dhl_account_number,
          dhl_base_url,
          dhl_from_name,
          dhl_from_street,
          dhl_from_city,
          dhl_from_state,
          dhl_from_zip,
          dhl_from_country,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        dhl_api_key || '',
        dhl_api_secret || '',
        dhl_account_number || '',
        dhl_base_url || 'https://express.api.dhl.com/mydhlapi/test',
        dhl_from_name || 'TailoredHands',
        dhl_from_street || '123 Business Street',
        dhl_from_city || 'Accra',
        dhl_from_state || 'Greater Accra',
        dhl_from_zip || '00233',
        dhl_from_country || 'GH'
      ]);
    } else {
      // Update existing settings record
      await query(`
        UPDATE settings SET 
          dhl_api_key = $1,
          dhl_api_secret = $2,
          dhl_account_number = $3,
          dhl_base_url = $4,
          dhl_from_name = $5,
          dhl_from_street = $6,
          dhl_from_city = $7,
          dhl_from_state = $8,
          dhl_from_zip = $9,
          dhl_from_country = $10,
          updated_at = NOW()
        WHERE id = $11
      `, [
        dhl_api_key || '',
        dhl_api_secret || '',
        dhl_account_number || '',
        dhl_base_url || 'https://express.api.dhl.com/mydhlapi/test',
        dhl_from_name || 'TailoredHands',
        dhl_from_street || '123 Business Street',
        dhl_from_city || 'Accra',
        dhl_from_state || 'Greater Accra',
        dhl_from_zip || '00233',
        dhl_from_country || 'GH',
        existingResult.rows[0].id
      ]);
    }

    // Reinitialize DHL service with new credentials
    try {
      const dhlService = require('../services/dhlService');
      dhlService.initialized = false;
      await dhlService.initialize();
    } catch (e) {
      console.warn('Could not reinitialize DHL service:', e.message);
    }

    console.log('✅ DHL shipping settings updated successfully');
    res.json({
      success: true,
      message: 'DHL shipping settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update shipping settings' 
    });
  }
});

/**
 * Test MyDHL API connection (rates request)
 * POST /api/shipping-settings/test-dhl
 * Body (optional): { baseUrl?, username?, password?, accountNumber? } - overrides DB/env for this test only
 */
router.post('/test-dhl', authenticateToken, async (req, res) => {
  const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
  if (!adminRoles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  // Try to get settings from database first
  let dbSettings = {};
  try {
    const result = await query('SELECT dhl_api_key, dhl_api_secret, dhl_account_number, dhl_base_url FROM settings LIMIT 1');
    if (result.rows.length > 0) {
      dbSettings = result.rows[0];
    }
  } catch (e) {
    console.warn('Could not fetch DHL settings from DB:', e.message);
  }

  const baseUrl = req.body?.baseUrl || dbSettings.dhl_base_url || process.env.MYDHL_BASE_URL || 'https://express.api.dhl.com/mydhlapi/test';
  const username = req.body?.username || dbSettings.dhl_api_key || process.env.MYDHL_USERNAME;
  const password = req.body?.password || dbSettings.dhl_api_secret || process.env.MYDHL_PASSWORD;
  const accountNumber = req.body?.accountNumber || dbSettings.dhl_account_number || process.env.MYDHL_ACCOUNT_NUMBER || '';

  if (!username || !password) {
    return res.json({
      success: false,
      error: 'MyDHL credentials not configured. Set MYDHL_USERNAME and MYDHL_PASSWORD in backend .env, or enter them in the form above and run the test again.',
    });
  }

  const plannedDate = new Date();
  plannedDate.setDate(plannedDate.getDate() + 1);
  const plannedShippingDateAndTime = plannedDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const body = {
    plannedShippingDateAndTime,
    productCode: 'N',
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: false,
    nextBusinessDay: true,
    accounts: [{ number: accountNumber || '000000000', typeCode: 'shipper' }],
    customerDetails: {
      shipperDetails: {
        addressLine1: 'Test Address Line 1',
        addressLine2: 'Test Address Line 2',
        addressLine3: 'Test Address Line 3',
        postalCode: '00233',
        cityName: 'Accra',
        countyName: 'Greater Accra',
        countryCode: 'GH',
      },
      receiverDetails: {
        addressLine1: 'Test Address Line 1',
        addressLine2: 'Test Address Line 2',
        addressLine3: 'Test Address Line 3',
        postalCode: '00233',
        cityName: 'Accra',
        countyName: 'Greater Accra',
        countryCode: 'GH',
      },
    },
    packages: [{ weight: 1, dimensions: { length: 15, width: 10, height: 10 } }],
  };

  try {
    const url = baseUrl.replace(/\/$/, '') + '/rates';
    const authHeader = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.message || data.detail || data.error || response.statusText;
      return res.json({
        success: false,
        error: `MyDHL API error (${response.status}): ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        details: data,
      });
    }

    const rates = data.products || data.rates || [];
    return res.json({
      success: true,
      message: rates.length ? `MyDHL connected. Received ${rates.length} rate(s).` : 'MyDHL connected. No rates returned for this test request.',
      rates: rates.slice(0, 5),
      raw: data,
    });
  } catch (err) {
    console.error('MyDHL test error:', err);
    return res.json({
      success: false,
      error: err.message || 'Failed to reach MyDHL API. Check base URL and network.',
    });
  }
});

/**
 * Test shipping configuration
 * POST /api/shipping/test
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const shippoService = require('../services/shippoService');
    
    if (!shippoService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Shippo is not configured. Please set your API key in settings.'
      });
    }

    // Test with a simple address validation
    const testAddress = {
      name: 'Test User',
      street1: '123 Test St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US'
    };

    const result = await shippoService.validateAddress(testAddress);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Shippo configuration is working correctly',
        testResult: result.validation
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Shippo test failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error testing shipping configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test shipping configuration' 
    });
  }
});

module.exports = router;
