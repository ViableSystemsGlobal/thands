const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

const splitFullName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
};

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (users table has full_name, not first_name/last_name)
    const fullName = `${firstName} ${lastName}`.trim();
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, email_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName, false]
    );

    const user = result.rows[0];

    // Create profile with first/last name and phone
    await query(
      `INSERT INTO profiles (user_id, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, firstName, lastName, phone || null]
    );

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.full_name?.split(' ')[0] || '',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        fullName: user.full_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         u.id,
         u.email,
         u.full_name,
         u.role,
         u.email_verified,
         u.created_at,
         u.updated_at,
         p.first_name,
         p.last_name,
         p.phone
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const fallbackName = splitFullName(user.full_name || '');
    const firstName = user.first_name || fallbackName.firstName;
    const lastName = user.last_name || fallbackName.lastName;
    const fullName = user.full_name ||
      [firstName, lastName].filter(Boolean).join(' ') || '';
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        fullName,
        phone: user.phone,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('fullName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, fullName, phone } = req.body;

    if (firstName === undefined && lastName === undefined && fullName === undefined && phone === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const existingResult = await query(
      `SELECT u.full_name, p.first_name, p.last_name, p.phone
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = existingResult.rows[0];
    const fallbackName = splitFullName(existing.full_name || '');
    let nextFirstName = firstName !== undefined
      ? firstName
      : (existing.first_name || fallbackName.firstName);
    let nextLastName = lastName !== undefined
      ? lastName
      : (existing.last_name || fallbackName.lastName);
    let nextFullName = fullName !== undefined
      ? fullName.trim()
      : [nextFirstName, nextLastName].filter(Boolean).join(' ');

    if (fullName !== undefined && firstName === undefined && lastName === undefined) {
      const splitName = splitFullName(nextFullName);
      nextFirstName = splitName.firstName;
      nextLastName = splitName.lastName;
    }

    const nextPhone = phone !== undefined ? phone : existing.phone;

    await query(
      `UPDATE users
       SET full_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [nextFullName, req.user.id]
    );

    const result = await query(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone,
         updated_at = CURRENT_TIMESTAMP
       RETURNING first_name, last_name, phone, updated_at`,
      [req.user.id, nextFirstName || null, nextLastName || null, nextPhone || null]
    );

    const userResult = await query(
      `SELECT id, email, full_name FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = result.rows[0];
    const user = userResult.rows[0];
    const resolvedFullName = user.full_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') || '';
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: resolvedFullName,
        phone: profile.phone,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role
      }
    });
});

// GET /api/auth/google-config - Public endpoint to check if Google auth is enabled
router.get('/google-config', async (req, res) => {
  try {
    const result = await query('SELECT google_auth_enabled, google_client_id FROM settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({ enabled: false, clientId: null });
    }
    const { google_auth_enabled, google_client_id } = result.rows[0];
    res.json({ enabled: !!google_auth_enabled, clientId: google_client_id || null });
  } catch (error) {
    console.error('Google config fetch error:', error);
    res.json({ enabled: false, clientId: null });
  }
});

// POST /api/auth/google - Sign in / sign up with Google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Check if Google auth is enabled
    const settingsResult = await query('SELECT google_auth_enabled, google_client_id FROM settings LIMIT 1');
    const settings = settingsResult.rows[0];
    if (!settings?.google_auth_enabled) {
      return res.status(403).json({ error: 'Google sign-in is not enabled' });
    }
    if (!settings.google_client_id) {
      return res.status(500).json({ error: 'Google Client ID is not configured' });
    }

    // Verify the Google ID token
    const client = new OAuth2Client(settings.google_client_id);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: settings.google_client_id,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email address' });
    }

    // Find or create user
    let user;
    const byGoogleId = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    if (byGoogleId.rows.length > 0) {
      user = byGoogleId.rows[0];
    } else {
      const byEmail = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (byEmail.rows.length > 0) {
        // Link Google ID to existing email account
        await query('UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2', [googleId, byEmail.rows[0].id]);
        user = { ...byEmail.rows[0], google_id: googleId };
      } else {
        // Create new user from Google account
        const resolvedFirstName = firstName || email.split('@')[0];
        const resolvedLastName = lastName || '';
        const resolvedFullName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(' ');
        const googlePasswordHash = await bcrypt.hash(`google:${googleId}`, 12);
        const result = await query(
          `INSERT INTO users (email, google_id, full_name, password_hash, email_verified, is_active)
           VALUES ($1, $2, $3, $4, true, true)
           RETURNING *`,
          [email, googleId, resolvedFullName, googlePasswordHash]
        );
        user = result.rows[0];

        await query(
          `INSERT INTO profiles (user_id, first_name, last_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id, resolvedFirstName, resolvedLastName]
        );
      }
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Google sign-in successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: firstName || splitFullName(user.full_name || '').firstName,
        lastName: lastName || splitFullName(user.full_name || '').lastName,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google sign-in failed. Invalid or expired credential.' });
  }
});

module.exports = router;
