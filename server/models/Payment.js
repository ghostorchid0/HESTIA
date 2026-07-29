const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  provider: { type: String, enum: ['chariow', 'qosic', 'manual'], default: 'chariow' },
  operator: { type: String, enum: ['togocel', 'moov', ''], default: '' },
  msisdn: { type: String, default: '' },
  transref: { type: String, default: '' },
  chariowLicenseKey: { type: String, default: '' },
  chariowResponse: { type: Object, default: null },
  qosicResponse: { type: Object, default: null },
  type: { type: String, enum: ['trial_to_active', 'renewal', 'manual', 'chariow_license'], default: 'renewal' },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
