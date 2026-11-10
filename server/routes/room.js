const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Room = require('../models/Room');
const Settings = require('../models/Settings');
const validateRoom = require('../middleware/validateRoom');

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please slow down.' },
});

router.get('/:uuid', publicLimiter, validateRoom, async (req, res) => {
  const hotel = req.room.hotelId || {};
  const hotelId = req.room.hotelId?._id || req.room.hotelId;
  
  // Fetch settings for branding
  const settings = await Settings.findOne({ hotelId }).sort({ createdAt: -1 });
  
  res.json({
    valid: true,
    room: { uuid: req.room.uuid, number: req.room.number, hotelId },
    hotel: {
      _id: hotel._id,
      name: hotel.name,
      slug: hotel.slug,
      currency: hotel.currency,
      contactPhone: hotel.contactPhone,
      address: hotel.address,
    },
    settings: settings ? {
      logoUrl: settings.logoUrl,
      accentColor: settings.accentColor,
      welcomeMessage: settings.welcomeMessage,
    } : {
      logoUrl: '',
      accentColor: '#C9A227',
      welcomeMessage: '',
    },
  });
});

module.exports = router;
