/**
 * MB MOTORS — backend/routes/kyc.js
 * Identity verification (KYC) routes
 *
 * POST /api/kyc/submit       — submit identity documents
 * GET  /api/kyc/status       — get KYC status for authenticated user
 * POST /api/kyc/verify-aadhaar — verify Aadhaar number (third-party API)
 * POST /api/kyc/verify-pan   — verify PAN number  (third-party API)
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const authMiddleware = require('../middleware/auth');
const User      = require('../models/user');

/* ── File upload config ───────────────────────────────────── */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../assets/uploads/kyc'));
  },
  filename(req, file, cb) {
    const userId = req.userId;
    const ext    = path.extname(file.originalname);
    cb(null, `${userId}-${file.fieldname}-${Date.now()}${ext}`);
  },
});

const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter(req, file, cb) {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and PDF files are accepted'));
    }
  },
});

const kycFields = upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back',  maxCount: 1 },
  { name: 'pan',           maxCount: 1 },
  { name: 'passport',      maxCount: 1 },
  { name: 'voter_id',      maxCount: 1 },
  { name: 'dl_front',      maxCount: 1 },
  { name: 'dl_back',       maxCount: 1 },
  { name: 'selfie',        maxCount: 1 },
]);

/* ── POST /api/kyc/submit ─────────────────────────────────── */
router.post('/submit', authMiddleware, kycFields, async (req, res) => {
  try {
    const {
      fullName, dob, gender, nationality, phone, email, address,
      aadhaarNumber, panNumber, passportNumber, voterId,
      dlNumber, dlState, dlIssueDate, dlExpiryDate,
    } = req.body;

    // Build document file paths
    const docs = {};
    for (const [field, files] of Object.entries(req.files || {})) {
      docs[field] = files[0].path;
    }

    // Update user record with KYC data
    await User.findByIdAndUpdate(req.userId, {
      kyc: {
        fullName, dob, gender, nationality, phone, email, address,
        aadhaarNumber,
        panNumber,
        passportNumber: passportNumber || null,
        voterId:        voterId        || null,
        dl: { number: dlNumber, state: dlState, issueDate: dlIssueDate, expiryDate: dlExpiryDate },
        documents: docs,
        submittedAt: new Date(),
      },
      kycStatus: 'under_review',
    });

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Review typically takes 10–15 minutes.',
      kycStatus: 'under_review',
    });
  } catch (err) {
    console.error('[kyc/submit]', err);
    res.status(500).json({ success: false, message: 'Failed to submit documents' });
  }
});

/* ── GET /api/kyc/status ──────────────────────────────────── */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('kycStatus kyc.submittedAt');
    res.json({
      success:    true,
      kycStatus:  user.kycStatus,
      submittedAt: user.kyc?.submittedAt || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── POST /api/kyc/verify-aadhaar ────────────────────────── */
router.post('/verify-aadhaar', authMiddleware, async (req, res) => {
  /**
   * Integration point: Connect to a DigiLocker / UIDAI third-party
   * verification API (e.g. Signzy, IDfy, Surepass) here.
   *
   * This stub simulates a successful verification response.
   */
  const { aadhaarNumber } = req.body;
  if (!aadhaarNumber || aadhaarNumber.replace(/\s/g, '').length !== 12) {
    return res.status(400).json({ success: false, message: 'Invalid Aadhaar number' });
  }
  res.json({ success: true, verified: true, message: 'Aadhaar verified' });
});

/* ── POST /api/kyc/verify-pan ────────────────────────────── */
router.post('/verify-pan', authMiddleware, async (req, res) => {
  /**
   * Integration point: Connect to Income Tax Department API
   * via a licensed aggregator (e.g. Signzy, Karza, Surepass).
   */
  const { panNumber } = req.body;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panNumber || !panRegex.test(panNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid PAN format' });
  }
  res.json({ success: true, verified: true, message: 'PAN verified' });
});

module.exports = router;
