const mongoose = require('mongoose');

const planDefaults = {
  STARTER: { maxRoomsAllowed: 12 },
  PRO: { maxRoomsAllowed: 35 },
  ENTERPRISE: { maxRoomsAllowed: 9999 },
};

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  currency: { type: String, default: 'XOF' },
  contactPhone: { type: String, default: '' },
  address: { type: String, default: '' },
  active: { type: Boolean, default: true },

  subscription: {
    plan: { type: String, enum: ['STARTER', 'PRO', 'ENTERPRISE'], default: 'STARTER' },
    status: { type: String, enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'], default: 'TRIAL' },
    maxRoomsAllowed: { type: Number, default: planDefaults.STARTER.maxRoomsAllowed },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    subscriptionExpiresAt: { type: Date, default: null },
  },

  // Legacy billing fields kept for existing records
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  subscriptionExpiresAt: { type: Date, default: null },
  billingPhone: { type: String, default: '' },
  billingEmail: { type: String, default: '' },
  billingOperator: { type: String, enum: ['togocel', 'moov', ''], default: '' },
  chariowLicenseKey: { type: String, default: '' },
  lastPaymentAt: { type: Date, default: null },
  lastInvoiceAt: { type: Date, default: null },
}, { timestamps: true });

hotelSchema.pre('save', function (next) {
  this.subscription.maxRoomsAllowed = planDefaults[this.subscription.plan]?.maxRoomsAllowed || planDefaults.STARTER.maxRoomsAllowed;
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);
