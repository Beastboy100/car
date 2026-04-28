/**
 * MB MOTORS — backend/routes/bookings.js
 * Vehicle booking routes
 *
 * POST /api/bookings        — create a new booking
 * GET  /api/bookings        — list user's bookings
 * GET  /api/bookings/:id    — get single booking detail
 * PUT  /api/bookings/:id/cancel — cancel a booking
 */

const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const kycRequired    = require('../middleware/kycRequired');
const Booking = require('../models/booking');
const Vehicle = require('../models/vehicle');

/* ── POST /api/bookings ───────────────────────────────────── */
router.post(
  '/',
  authMiddleware,
  kycRequired,       // ← KYC gate: user must be verified before booking
  [
    body('vehicleId').notEmpty(),
    body('pickupDate').isISO8601().withMessage('Invalid pick-up date'),
    body('returnDate').isISO8601().withMessage('Invalid return date'),
    body('pickupLocation').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { vehicleId, pickupDate, returnDate, pickupLocation, dropLocation, extras } = req.body;

    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      const pd = new Date(pickupDate);
      const rd = new Date(returnDate);
      if (rd <= pd) return res.status(400).json({ success: false, message: 'Return date must be after pick-up date' });

      const days      = Math.ceil((rd - pd) / 86400000);
      const baseTotal = vehicle.dailyRate * days;
      const extrasTotal = (extras || []).reduce((sum, e) => sum + (e.pricePerDay * days), 0);
      const total       = baseTotal + extrasTotal;

      const booking = await Booking.create({
        user:           req.userId,
        vehicle:        vehicleId,
        pickupDate:     pd,
        returnDate:     rd,
        pickupLocation,
        dropLocation:   dropLocation || pickupLocation,
        days,
        baseTotal,
        extras:         extras || [],
        extrasTotal,
        total,
        status:         'confirmed',
        reference:      `MB-${Date.now().toString(36).toUpperCase()}`,
      });

      res.status(201).json({ success: true, booking });
    } catch (err) {
      console.error('[bookings/create]', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/* ── GET /api/bookings ────────────────────────────────────── */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate('vehicle', 'name model dailyRate images')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── GET /api/bookings/:id ────────────────────────────────── */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId })
      .populate('vehicle');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── PUT /api/bookings/:id/cancel ─────────────────────────── */
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hoursUntilPickup = (new Date(booking.pickupDate) - Date.now()) / 3600000;
    if (hoursUntilPickup < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cancellations must be made at least 24 hours before pick-up',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled. Refund will be processed within 5–7 business days.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
