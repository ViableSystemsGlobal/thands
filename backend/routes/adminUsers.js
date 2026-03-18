const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Admin roles and their permissions
const ADMIN_ROLES = {
  'super_admin': {
    name: 'Super Admin',
    permissions: ['*'] // All permissions
  },
  'admin': {
    name: 'Admin',
    permissions: [
      'products:read', 'products:write', 'products:delete',
      'orders:read', 'orders:write',
      'customers:read', 'customers:write',
      'consultations:read', 'consultations:write',
      'sales:read',
      'settings:read', 'settings:write',
      'users:read', 'users:write', 'users:delete'
    ]
  },
  'manager': {
    name: 'Manager',
    permissions: [
      'products:read', 'products:write',
      'orders:read', 'orders:write',
      'customers:read',
      'consultations:read',
      'sales:read'
    ]
  },
  'support': {
    name: 'Support',
    permissions: [
      'orders:read',
      'customers:read',
      'consultations:read', 'consultations:write',
      'messages:read', 'messages:write'
    ]
  }
};

// GET /api/admin/users/roles - Get available roles (must come before /:id)
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, roles: ADMIN_ROLES });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/admin/users/test-auth - Test authentication (must come before /:id)
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Authentication working!', 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// GET /api/admin/users - List all admin users
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if current user has permission to list users
    if (!hasPermission(req.user.role, 'users:read')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await query(`
      SELECT 
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE role IN ('super_admin', 'admin', 'manager', 'support')
      ORDER BY created_at DESC
    `);

    // Add role names and permissions to each user
    const users = result.rows.map(user => ({
      ...user,
      role_name: ADMIN_ROLES[user.role]?.name || 'Unknown',
      permissions: ADMIN_ROLES[user.role]?.permissions || []
    }));

    console.log('🔍 Users from database:', JSON.stringify(users, null, 2));
    res.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// POST /api/admin/users - Create new admin user
router.post('/', authenticateToken, [
  body('email').isEmail().normalizeEmail(),
  body('full_name').trim().isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['super_admin', 'admin', 'manager', 'support']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if current user has permission to create users
    if (!hasPermission(req.user.role, 'users:write')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { email, full_name, password, role } = req.body;

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(`
      INSERT INTO users (email, full_name, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, email, full_name, role, is_active, created_at
    `, [email, full_name, hashedPassword, role]);

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        ...newUser,
        role_name: ADMIN_ROLES[newUser.role]?.name || 'Unknown',
        permissions: ADMIN_ROLES[newUser.role]?.permissions || []
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// PUT /api/admin/users/:id - Update admin user
router.put('/:id', authenticateToken, [
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('role').optional().isIn(['super_admin', 'admin', 'manager', 'support']),
  body('is_active').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if current user has permission to update users
    if (!hasPermission(req.user.role, 'users:write')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    // Get target user info
    const targetUser = await query('SELECT role, email FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only super_admin can modify other super_admins
    if (targetUser.rows[0].role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admin can modify Super Admin accounts' });
    }

    // Prevent super_admin from demoting themselves
    if (targetUser.rows[0].email === req.user.email && req.user.role === 'super_admin' && role && role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin cannot demote themselves' });
    }

    // Regular admins cannot modify their own account
    if (targetUser.rows[0].email === req.user.email && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, role, is_active, updated_at
    `, values);

    res.json({
      message: 'User updated successfully',
      user: {
        ...result.rows[0],
        role_name: ADMIN_ROLES[result.rows[0].role]?.name || 'Unknown',
        permissions: ADMIN_ROLES[result.rows[0].role]?.permissions || []
      }
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

// DELETE /api/admin/users/:id - Delete admin user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if current user has permission to delete users
    if (!hasPermission(req.user.role, 'users:delete')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { id } = req.params;

    // Get target user info
    const targetUser = await query('SELECT role, email FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only super_admin can delete other super_admins
    if (targetUser.rows[0].role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete Super Admin accounts' });
    }

    // No one can delete themselves (including super_admin)
    if (targetUser.rows[0].email === req.user.email) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

// Helper function to check permissions
function hasPermission(userRole, requiredPermission) {
  const userPermissions = ADMIN_ROLES[userRole]?.permissions || [];
  
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check if user has the specific permission
  return userPermissions.includes(requiredPermission);
}

module.exports = router;
