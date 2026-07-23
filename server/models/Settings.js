const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, unique: true },
  hotelName: { type: String, default: 'Hestia' },
  currency: { type: String, default: '$' },
  contactPhone: { type: String, default: '' },
  address: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
