const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

router.get('/', async (req, res) => {
  const hotel = await Hotel.findOne({ slug: 'demo' });
  if (!hotel) return res.status(404).json({ message: 'Demo hotel not configured' });
  const rooms = await Room.find({ hotelId: hotel._id, active: true }).sort({ number: 1 });
  res.json({ hotel, rooms });
});

module.exports = router;
