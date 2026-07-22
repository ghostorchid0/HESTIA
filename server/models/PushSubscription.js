const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  roomUuid: { type: String, required: true, index: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
