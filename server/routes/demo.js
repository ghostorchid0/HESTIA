const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please slow down.' },
});

router.get('/', publicLimiter, async (req, res) => {
  const hotel = await Hotel.findOne({ slug: 'demo' });
  if (!hotel) return res.status(404).json({ message: 'Demo hotel not configured' });
  const rooms = await Room.find({ hotelId: hotel._id, active: true }).sort({ number: 1 });
  res.json({ hotel, rooms });
});

module.exports = router;
