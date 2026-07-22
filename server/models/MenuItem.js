const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
