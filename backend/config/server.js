/**
 * MB MOTORS — backend/config/server.js
 * Express application entry point
 *
 * Run:  node backend/config/server.js
 *   or: npm run dev  (uses nodemon)
 */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes     = require('../routes/auth');
const kycRoutes      = require('../routes/kyc');
const bookingRoutes  = require('../routes/bookings');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Security middleware ──────────────────────────────────── */
app.use(helmet({ contentSecurityPolicy: false }));  // disable CSP for dev (tighten in production)
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

/* ── Rate limiting ────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again later' },
});
app.use('/api/', limiter);

/* ── Body parsing ─────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Static files (frontend) ─────────────────────────────── */
app.use(express.static(path.join(__dirname, '../../')));

/* ── API routes ───────────────────────────────────────────── */
app.use('/api/auth',     authRoutes);
app.use('/api/kyc',      kycRoutes);
app.use('/api/bookings', bookingRoutes);

/* ── Health check ─────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── SPA fallback ─────────────────────────────────────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

/* ── Global error handler ─────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

/* ── Database + server start ──────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('[db] Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      let localIP = 'localhost';
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
            break;
          }
        }
      }
      console.log(`[server] Running on http://localhost:${PORT}`);
      console.log(`[server] Network access: http://${localIP}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
