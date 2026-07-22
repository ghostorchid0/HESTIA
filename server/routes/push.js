const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const config = require('../config');
const Room = require('../models/Room');
const { saveSubscription } = require('../services/push');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: config.vapidPublicKey });
});

router.post('/subscribe',
  body('roomUuid').isString().notEmpty(),
  body('subscription.endpoint').isURL(),
  body('subscription.keys.p256dh').isString().notEmpty(),
  body('subscription.keys.auth').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { roomUuid, subscription } = req.body;
    const room = await Room.findOne({ uuid: roomUuid, active: true });
    if (!room) return res.status(404).json({ message: 'Invalid room' });

    await saveSubscription(roomUuid, subscription);
    res.json({ message: 'Subscribed' });
  });

module.exports = router;
