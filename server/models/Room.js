const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, index: true },
  number: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
