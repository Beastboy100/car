/**
 * MB MOTORS — backend/routes/auth.js
 * Authentication routes
 *
 * POST /api/auth/register  — create new user account
 * POST /api/auth/login     — authenticate existing user
 * POST /api/auth/logout    — invalidate session/token
 * GET  /api/auth/me        — return authenticated user profile
 */

const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/user');
const authMiddleware = require('../middleware/auth');

/* ── POST /api/auth/register ──────────────────────────────── */
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('phone').isMobilePhone('en-IN').withMessage('Invalid Indian phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({
        firstName, lastName, email, phone,
        passwordHash: hash,
        kycStatus: 'pending',
      });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: `${firstName} ${lastName}`, email, kycStatus: 'pending' },
      });
    } catch (err) {
      console.error('[auth/register]', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/* ── POST /api/auth/login ─────────────────────────────────── */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        token,
        user: {
          id:        user._id,
          name:      `${user.firstName} ${user.lastName}`,
          email:     user.email,
          kycStatus: user.kycStatus,
        },
      });
    } catch (err) {
      console.error('[auth/login]', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/* ── GET /api/auth/me ─────────────────────────────────────── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      user: {
        id:        user._id,
        name:      `${user.firstName} ${user.lastName}`,
        email:     user.email,
        phone:     user.phone,
        kycStatus: user.kycStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── POST /api/auth/logout ────────────────────────────────── */
router.post('/logout', authMiddleware, (req, res) => {
  // With JWT we rely on client-side token removal.
  // For server-side invalidation, maintain a token blacklist in Redis.
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
