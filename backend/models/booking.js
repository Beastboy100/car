/**
 * MB MOTORS — backend/models/booking.js
 * Mongoose Booking schema
 */

const mongoose = require('mongoose');

const extraSchema = new mongoose.Schema({
  label:       { type: String, required: true },
  pricePerDay: { type: Number, required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  reference:      { type: String, unique: true },
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  pickupDate:     { type: Date, required: true },
  returnDate:     { type: Date, required: true },
  pickupLocation: { type: String, required: true },
  dropLocation:   { type: String, required: true },
  days:           { type: Number, required: true },
  baseTotal:      { type: Number, required: true },
  extras:         [extraSchema],
  extrasTotal:    { type: Number, default: 0 },
  total:          { type: Number, required: true },
  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
  driverDetails: {
    firstName: String,
    lastName:  String,
    email:     String,
    phone:     String,
    licenceNo: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
