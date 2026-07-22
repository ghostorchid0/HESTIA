const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const validateRoom = require('../middleware/validateRoom');

router.get('/:uuid', validateRoom, async (req, res) => {
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
