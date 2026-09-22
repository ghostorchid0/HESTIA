const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  provider: { type: String, enum: ['chariow', 'qosic', 'manual', 'sasapay'], default: 'chariow' },
  operator: { type: String, enum: ['togocel', 'moov', 'mtn_bj', 'orange_ci', 'wave', ''], default: '' },
  msisdn: { type: String, default: '' },
  transref: { type: String, default: '' },
  chariowLicenseKey: { type: String, default: '' },
  chariowResponse: { type: Object, default: null },
  qosicResponse: { type: Object, default: null },
  sasapayResponse: { type: Object, default: null }, // SasPay payment response
  type: { type: String, enum: ['trial_to_active', 'renewal', 'manual', 'chariow_license'], default: 'renewal' },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
