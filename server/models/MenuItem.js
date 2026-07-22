const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
