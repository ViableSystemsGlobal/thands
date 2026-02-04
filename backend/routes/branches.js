const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireBranchAccess, getUserBranches } = require('../middleware/branchAccess');
const { query } = require('../config/database');
const router = express.Router();

/**
 * GET /api/branches - List all active branches
 * Public endpoint - no auth required
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        branch_code,
        branch_name,
        country_code,
        default_currency,
        is_active,
        is_default
       FROM branch_settings 
       WHERE is_active = true 
       ORDER BY is_default DESC, branch_name`
    );
    res.json({ success: true, branches: result.rows });
  } catch (error) {
    // If table doesn't exist yet, return default branches
    if (error.message && error.message.includes('does not exist')) {
      console.warn('Branch settings table does not exist yet. Run migration: backend/migrations/09_create_branch_system.sql');
      res.json({ 
        success: true, 
        branches: [
          { branch_code: 'GH', branch_name: 'Ghana', country_code: 'GH', default_currency: 'GHS', is_active: true, is_default: true },
          { branch_code: 'UK', branch_name: 'United Kingdom', country_code: 'GB', default_currency: 'GBP', is_active: true, is_default: false },
          { branch_code: 'US', branch_name: 'United States', country_code: 'US', default_currency: 'USD', is_active: true, is_default: false }
        ]
      });
    } else {
      console.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  }
});

/**
 * GET /api/branches/current - Get current branch (from context)
 * Public endpoint - uses branch context middleware
 */
router.get('/current', async (req, res) => {
  try {
    // req.branchSettings is set by branchContext middleware
    if (!req.branchSettings) {
      return res.status(500).json({ error: 'Branch context not available' });
    }
    
    res.json({ 
      success: true, 
      branch: {
        branch_code: req.branchSettings.branch_code,
        branch_name: req.branchSettings.branch_name,
        country_code: req.branchSettings.country_code,
        default_currency: req.branchSettings.default_currency,
        shipping_origin_city: req.branchSettings.shipping_origin_city,
        shipping_origin_country: req.branchSettings.shipping_origin_country
      }
    });
  } catch (error) {
    console.error('Error fetching current branch:', error);
    res.status(500).json({ error: 'Failed to fetch current branch' });
  }
});

/**
 * GET /api/branches/admin/accessible - Get branches admin can access
 * Admin only - MUST be defined BEFORE /:code route
 */
router.get('/admin/accessible', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Admin accessible branches request from:', req.user?.email, 'role:', req.user?.role);
    
    if (req.user.role === 'super_admin') {
      // Super admin sees all branches
      let result;
      try {
        result = await query(
          `SELECT branch_code, branch_name, country_code, default_currency, is_active, is_default 
           FROM branch_settings 
           WHERE is_active = true 
           ORDER BY is_default DESC, branch_name`
        );
      } catch (dbError) {
        // If table doesn't exist, return default branches
        if (dbError.message && dbError.message.includes('does not exist')) {
          console.warn('Branch settings table does not exist, returning default branches');
          return res.json({ 
            success: true, 
            branches: [
              { branch_code: 'GH', branch_name: 'Ghana', country_code: 'GH', default_currency: 'GHS', is_active: true, is_default: true },
              { branch_code: 'UK', branch_name: 'United Kingdom', country_code: 'GB', default_currency: 'GBP', is_active: true, is_default: false },
              { branch_code: 'US', branch_name: 'United States', country_code: 'US', default_currency: 'USD', is_active: true, is_default: false }
            ]
          });
        }
        throw dbError;
      }
      
      // If no branches found, return default branches
      if (result.rows.length === 0) {
        console.warn('No active branches found in database, returning defaults');
        return res.json({ 
          success: true, 
          branches: [
            { branch_code: 'GH', branch_name: 'Ghana', country_code: 'GH', default_currency: 'GHS', is_active: true, is_default: true },
            { branch_code: 'UK', branch_name: 'United Kingdom', country_code: 'GB', default_currency: 'GBP', is_active: true, is_default: false },
            { branch_code: 'US', branch_name: 'United States', country_code: 'US', default_currency: 'USD', is_active: true, is_default: false }
          ]
        });
      }
      
      console.log('✅ Returning', result.rows.length, 'branches for super admin');
      res.json({ success: true, branches: result.rows });
    } else {
      // Regular admin sees only assigned branches
      const result = await query(
        `SELECT bs.branch_code, bs.branch_name, bs.country_code, bs.default_currency, bs.is_active, bs.is_default 
         FROM branch_settings bs
         INNER JOIN user_branch_access uba ON bs.branch_code = uba.branch_code
         WHERE uba.user_id = $1 AND bs.is_active = true
         ORDER BY bs.is_default DESC, bs.branch_name`,
        [req.user.id]
      );
      console.log('✅ Returning', result.rows.length, 'branches for admin');
      res.json({ success: true, branches: result.rows });
    }
  } catch (error) {
    console.error('Error fetching accessible branches:', error);
    res.status(500).json({ error: 'Failed to fetch accessible branches' });
  }
});

/**
 * POST /api/branches/admin/assign - Assign branch access to user
 * Super admin only
 */
router.post('/admin/assign', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    const { user_id, branch_code } = req.body;
    
    if (!user_id || !branch_code) {
      return res.status(400).json({ error: 'user_id and branch_code are required' });
    }
    
    // Verify branch exists
    const branchCheck = await query(
      `SELECT * FROM branch_settings WHERE branch_code = $1`,
      [branch_code]
    );
    
    if (branchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    // Assign access
    await query(
      `INSERT INTO user_branch_access (user_id, branch_code)
       VALUES ($1, $2)
       ON CONFLICT (user_id, branch_code) DO NOTHING`,
      [user_id, branch_code]
    );
    
    res.json({ success: true, message: 'Branch access assigned' });
  } catch (error) {
    console.error('Error assigning branch access:', error);
    res.status(500).json({ error: 'Failed to assign branch access' });
  }
});

/**
 * DELETE /api/branches/admin/assign - Remove branch access from user
 * Super admin only
 */
router.delete('/admin/assign', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    const { user_id, branch_code } = req.body;
    
    if (!user_id || !branch_code) {
      return res.status(400).json({ error: 'user_id and branch_code are required' });
    }
    
    await query(
      `DELETE FROM user_branch_access 
       WHERE user_id = $1 AND branch_code = $2`,
      [user_id, branch_code]
    );
    
    res.json({ success: true, message: 'Branch access removed' });
  } catch (error) {
    console.error('Error removing branch access:', error);
    res.status(500).json({ error: 'Failed to remove branch access' });
  }
});

/**
 * GET /api/branches/:code - Get specific branch details
 * Public endpoint - MUST be defined AFTER all /admin/* routes
 */
router.get('/:code', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM branch_settings WHERE branch_code = $1 AND is_active = true`,
      [req.params.code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      // If table doesn't exist, return default branch config
      const code = req.params.code.toUpperCase();
      const defaultBranches = {
        'GH': {
          branch_code: 'GH',
          branch_name: 'Ghana',
          country_code: 'GH',
          default_currency: 'GHS',
          shipping_origin_city: 'Accra',
          shipping_origin_country: 'GH',
          shippo_from_city: 'Accra',
          shippo_from_state: 'Greater Accra',
          shippo_from_zip: '00233',
          shippo_from_country: 'GH',
          is_active: true,
          is_default: true
        },
        'UK': {
          branch_code: 'UK',
          branch_name: 'United Kingdom',
          country_code: 'GB',
          default_currency: 'GBP',
          shipping_origin_city: 'London',
          shipping_origin_country: 'GB',
          shippo_from_city: 'London',
          shippo_from_state: 'England',
          shippo_from_zip: 'SW1A 1AA',
          shippo_from_country: 'GB',
          is_active: true,
          is_default: false
        },
        'US': {
          branch_code: 'US',
          branch_name: 'United States',
          country_code: 'US',
          default_currency: 'USD',
          shipping_origin_city: 'New York',
          shipping_origin_country: 'US',
          shippo_from_city: 'New York',
          shippo_from_state: 'NY',
          shippo_from_zip: '10001',
          shippo_from_country: 'US',
          is_active: true,
          is_default: false
        }
      };
      
      if (defaultBranches[code]) {
        return res.json({ success: true, branch: defaultBranches[code] });
      }
      
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ success: true, branch: result.rows[0] });
  } catch (error) {
    // If table doesn't exist, return default branch
    if (error.message && error.message.includes('does not exist')) {
      console.warn('Branch settings table does not exist yet. Run migration: backend/migrations/09_create_branch_system.sql');
      const code = req.params.code.toUpperCase();
      const defaultBranches = {
        'GH': { branch_code: 'GH', branch_name: 'Ghana', country_code: 'GH', default_currency: 'GHS', shipping_origin_country: 'GH', shipping_origin_city: 'Accra', is_active: true, is_default: true },
        'UK': { branch_code: 'UK', branch_name: 'United Kingdom', country_code: 'GB', default_currency: 'GBP', shipping_origin_country: 'GB', shipping_origin_city: 'London', is_active: true, is_default: false },
        'US': { branch_code: 'US', branch_name: 'United States', country_code: 'US', default_currency: 'USD', shipping_origin_country: 'US', shipping_origin_city: 'New York', is_active: true, is_default: false }
      };
      
      if (defaultBranches[code]) {
        return res.json({ success: true, branch: defaultBranches[code] });
      }
    }
    
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

module.exports = router;
