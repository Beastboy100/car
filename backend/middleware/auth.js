/**
 * MB MOTORS — backend/middleware/auth.js
 * JWT authentication middleware
 *
 * Attaches req.userId if the Bearer token is valid.
 * Returns 401 if token is missing, malformed or expired.
 */

const jwt  = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
