/**
 * Admin Branch Filter Middleware
 * Extracts branch filter from X-Admin-Branch-Filter header
 * Adds req.adminBranchFilter to request (null for "ALL", branch_code otherwise)
 */
function adminBranchFilter(req, res, next) {
  const branchFilter = req.headers['x-admin-branch-filter'];
  
  // If header is present and not empty, use it; otherwise null (view all)
  req.adminBranchFilter = branchFilter && branchFilter.trim() !== '' ? branchFilter.trim() : null;
  
  // Super admins can view all branches (null = all)
  // Regular admins will have their accessible branches filtered by requireBranchAccess middleware
  next();
}

module.exports = adminBranchFilter;

