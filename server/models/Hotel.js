const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  currency: { type: String, default: 'XOF' },
  contactPhone: { type: String, default: '' },
  address: { type: String, default: '' },
  active: { type: Boolean, default: true },
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  subscriptionExpiresAt: { type: Date, default: null },
  billingPhone: { type: String, default: '' },
  billingEmail: { type: String, default: '' },
  billingOperator: { type: String, enum: ['togocel', 'moov', ''], default: '' },
  lastPaymentAt: { type: Date, default: null },
  lastInvoiceAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
