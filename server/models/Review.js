const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  roomUuid: { type: String, required: true },
  roomNumber: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
