const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: String,
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, default: 'system' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomUuid: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled'],
    default: 'Received',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on delivery', 'Mobile Money', 'Room charge'],
    default: 'Cash on delivery',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  history: [statusHistorySchema],
  total: { type: Number, required: true, min: 0 },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
