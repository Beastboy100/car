/**
 * MB MOTORS — backend/middleware/kycRequired.js
 * KYC gate middleware
 *
 * Must be used AFTER authMiddleware.
 * Returns 403 if the authenticated user has not completed identity verification.
 *
 * Usage:
 *   router.post('/bookings', authMiddleware, kycRequired, handler)
 */

const User = require('../models/user');

module.exports = async function kycRequired(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('kycStatus');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.kycStatus !== 'verified') {
      return res.status(403).json({
        success:   false,
        code:      'KYC_REQUIRED',
        message:   'Identity verification must be completed before making a booking.',
        kycStatus: user.kycStatus,
      });
    }

    next();
  } catch (err) {
    console.error('[kycRequired]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
