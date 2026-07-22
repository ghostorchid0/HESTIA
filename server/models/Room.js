const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  uuid: { type: String, required: true, unique: true, index: true },
  number: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
