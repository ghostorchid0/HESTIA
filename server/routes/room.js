const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Room = require('../models/Room');
const validateRoom = require('../middleware/validateRoom');

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please slow down.' },
});

router.get('/:uuid', publicLimiter, validateRoom, async (req, res) => {
  const hotel = req.room.hotelId || {};
  res.json({
    valid: true,
    room: { uuid: req.room.uuid, number: req.room.number, hotelId: req.room.hotelId?._id || req.room.hotelId },
    hotel: {
      _id: hotel._id,
      name: hotel.name,
      slug: hotel.slug,
      logo: hotel.logo,
      currency: hotel.currency,
      contactPhone: hotel.contactPhone,
      address: hotel.address,
    },
  });
});

module.exports = router;
