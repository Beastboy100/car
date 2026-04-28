/**
 * MB MOTORS — backend/models/user.js
 * Mongoose User schema
 */

const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  fullName:       String,
  dob:            Date,
  gender:         String,
  nationality:    String,
  phone:          String,
  email:          String,
  address:        String,
  aadhaarNumber:  String,
  panNumber:      String,
  passportNumber: String,
  voterId:        String,
  dl: {
    number:     String,
    state:      String,
    issueDate:  Date,
    expiryDate: Date,
  },
  documents: {
    aadhaar_front: String,
    aadhaar_back:  String,
    pan:           String,
    passport:      String,
    voter_id:      String,
    dl_front:      String,
    dl_back:       String,
    selfie:        String,
  },
  submittedAt: Date,
  reviewedAt:  Date,
  reviewNotes: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  kycStatus: {
    type:    String,
    enum:    ['pending', 'under_review', 'verified', 'rejected'],
    default: 'pending',
  },
  kyc:  kycSchema,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, {
  timestamps: true,  // createdAt, updatedAt
});

/* Virtual: full name */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
