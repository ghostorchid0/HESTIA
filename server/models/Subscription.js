const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  status: { type: String, enum: ['pending', 'active', 'failed', 'cancelled'], default: 'pending' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  paymentMethod: { type: String, enum: ['sasapay', 'chariow', 'manual'], default: 'sasapay' },
  paymentId: { type: String, default: '' }, // SasPay payment ID
  transactionRef: { type: String, default: '' }, // Legacy transaction reference
  paymentData: { type: Object, default: null }, // Raw payment response data
  idempotencyKey: { type: String, default: '' }, // For idempotency
  paidAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);