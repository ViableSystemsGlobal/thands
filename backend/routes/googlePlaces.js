const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

/**
 * GET /api/settings/google-places-api-key - Get Google Places API key
 */
router.get('/google-places-api-key', async (req, res) => {
  try {
    const result = await query(`
      SELECT google_places_api_key 
      FROM settings 
      WHERE id = 1
    `);
    
    if (result.rows.length > 0) {
      res.json({ 
        google_places_api_key: result.rows[0].google_places_api_key || null 
      });
    } else {
      res.json({ google_places_api_key: null });
    }
  } catch (error) {
    console.error('Error fetching Google Places API key:', error);
    res.status(500).json({ error: 'Failed to fetch Google Places API key' });
  }
});

module.exports = router;
