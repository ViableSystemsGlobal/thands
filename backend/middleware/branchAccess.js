const { query } = require('../config/database');

/**
 * Branch Access Control Middleware
 * Ensures admin can only access their assigned branches
 * Super admins can access all branches
 */
async function requireBranchAccess(req, res, next) {
  try {
    // Public routes don't need branch access check
    if (!req.user) {
      return next();
    }
    
    const user = req.user;
    const requestedBranch = req.branchCode;
    
    // Super admins can access all branches
    if (user.role === 'super_admin') {
      req.userBranches = ['GH', 'UK', 'US']; // All branches
      return next();
    }
    
    // Check if user has access to this branch
    const accessResult = await query(
      `SELECT * FROM user_branch_access 
       WHERE user_id = $1 AND branch_code = $2`,
      [user.id, requestedBranch]
    );
    
    if (accessResult.rows.length === 0) {
      // Get user's accessible branches for error message
      const userBranches = await getUserBranches(user.id);
      return res.status(403).json({ 
        error: 'You do not have access to this branch',
        requestedBranch,
        userBranches
      });
    }
    
    // Add user's accessible branches to request
    req.userBranches = await getUserBranches(user.id);
    
    next();
  } catch (error) {
    console.error('Branch access check error:', error);
    res.status(500).json({ error: 'Failed to verify branch access' });
  }
}

/**
 * Get all branches a user has access to
 */
async function getUserBranches(userId) {
  try {
    const result = await query(
      `SELECT branch_code FROM user_branch_access WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map(r => r.branch_code);
  } catch (error) {
    console.error('Error getting user branches:', error);
    return [];
  }
}

module.exports = { requireBranchAccess, getUserBranches };

