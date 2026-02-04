const { query } = require('../config/database');

/**
 * Branch Context Middleware
 * Detects branch from:
 * 1. X-Branch-Code header (from frontend)
 * 2. Query parameter ?branch=UK
 * 3. Default to 'GH'
 * 
 * Adds to req:
 * - req.branchCode (e.g., 'GH', 'UK', 'US')
 * - req.branchSettings (full branch config from DB)
 */
async function branchContext(req, res, next) {
  try {
    let branchCode = null;
    
    // Priority 1: Header from frontend (most reliable)
    branchCode = req.headers['x-branch-code'];
    
    // Priority 2: Query parameter
    if (!branchCode) {
      branchCode = req.query.branch;
    }
    
    // Priority 3: Default fallback
    branchCode = branchCode || 'GH';
    
    // Validate branch code
    const validBranches = ['GH', 'UK', 'US'];
    if (!validBranches.includes(branchCode)) {
      branchCode = 'GH'; // Safe fallback
    }
    
    // Fetch branch settings from database
    let branchResult;
    try {
      branchResult = await query(
        `SELECT * FROM branch_settings WHERE branch_code = $1 AND is_active = true`,
        [branchCode]
      );
    } catch (error) {
      // If table doesn't exist, use hardcoded defaults
      if (error.message && error.message.includes('does not exist')) {
        console.warn('Branch settings table does not exist yet. Using default branch config. Run migration: backend/migrations/09_create_branch_system.sql');
        branchResult = { rows: [] };
      } else {
        throw error;
      }
    }
    
    if (branchResult.rows.length === 0) {
      // Fallback to default branch if requested branch not found
      let defaultResult;
      try {
        defaultResult = await query(
          `SELECT * FROM branch_settings WHERE is_default = true AND is_active = true LIMIT 1`
        );
      } catch (error) {
        defaultResult = { rows: [] };
      }
      
      if (defaultResult.rows.length > 0) {
        req.branchCode = defaultResult.rows[0].branch_code;
        req.branchSettings = defaultResult.rows[0];
      } else {
        // Last resort: hardcoded defaults
        const defaultBranches = {
          'GH': {
            branch_code: 'GH',
            branch_name: 'Ghana',
            default_currency: 'GHS',
            shipping_origin_country: 'GH',
            shipping_origin_city: 'Accra',
            shippo_from_country: 'GH',
            shippo_from_city: 'Accra',
            shippo_from_state: 'Greater Accra',
            shippo_from_zip: '00233'
          },
          'UK': {
            branch_code: 'UK',
            branch_name: 'United Kingdom',
            default_currency: 'GBP',
            shipping_origin_country: 'GB',
            shipping_origin_city: 'London',
            shippo_from_country: 'GB',
            shippo_from_city: 'London',
            shippo_from_state: 'England',
            shippo_from_zip: 'SW1A 1AA'
          },
          'US': {
            branch_code: 'US',
            branch_name: 'United States',
            default_currency: 'USD',
            shipping_origin_country: 'US',
            shipping_origin_city: 'New York',
            shippo_from_country: 'US',
            shippo_from_city: 'New York',
            shippo_from_state: 'NY',
            shippo_from_zip: '10001'
          }
        };
        
        req.branchCode = branchCode;
        req.branchSettings = defaultBranches[branchCode] || defaultBranches['GH'];
      }
    } else {
      req.branchCode = branchCode;
      req.branchSettings = branchResult.rows[0];
    }
    
    // Add branch code to response headers (for frontend to sync)
    res.setHeader('X-Branch-Code', req.branchCode);
    
    next();
  } catch (error) {
    console.error('Branch context error:', error);
    // Fail gracefully with default branch
    req.branchCode = 'GH';
    req.branchSettings = { 
      branch_code: 'GH', 
      branch_name: 'Ghana',
      default_currency: 'GHS',
      shipping_origin_country: 'GH',
      shipping_origin_city: 'Accra'
    };
    next();
  }
}

module.exports = branchContext;

