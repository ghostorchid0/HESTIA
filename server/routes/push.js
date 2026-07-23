const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const config = require('../config');
const Room = require('../models/Room');
const PushSubscription = require('../models/PushSubscription');
const { saveSubscription } = require('../services/push');

const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.push.apple.com',
  'web.push.apple.com',
];

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: config.vapidPublicKey });
});

const subscribeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: 'Too many subscription attempts, please slow down.' },
});

router.post('/subscribe',
  subscribeLimiter,
  body('roomUuid').isString().notEmpty(),
  body('subscription.endpoint').isURL({ protocols: ['https'], require_protocol: true }),
  body('subscription.keys.p256dh').isString().notEmpty(),
  body('subscription.keys.auth').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { roomUuid, subscription } = req.body;
    const room = await Room.findOne({ uuid: roomUuid, active: true });
    if (!room) return res.status(404).json({ message: 'Invalid room' });

    const url = new URL(subscription.endpoint);
    if (!ALLOWED_PUSH_HOSTS.includes(url.hostname)) {
      return res.status(400).json({ message: 'Invalid push endpoint' });
    }

    const count = await PushSubscription.countDocuments({ roomUuid });
    if (count >= 5) {
      return res.status(429).json({ message: 'Too many subscriptions for this room' });
    }

    await saveSubscription(roomUuid, subscription);
    res.json({ message: 'Subscribed' });
  });

module.exports = router;
