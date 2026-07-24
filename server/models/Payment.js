const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  operator: { type: String, enum: ['togocel', 'moov'], required: true },
  msisdn: { type: String, required: true },
  transref: { type: String, required: true, unique: true },
  qosicResponse: { type: Object, default: null },
  type: { type: String, enum: ['trial_to_active', 'renewal', 'manual'], default: 'renewal' },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
