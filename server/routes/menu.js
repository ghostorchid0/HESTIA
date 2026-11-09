const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please slow down.' },
});

function isSubscriptionActive(hotel) {
  if (!hotel) return false;
  const now = new Date();
  // Check subscription status
  const status = hotel.subscriptionStatus || hotel.subscription?.status;
  const expiresAt = hotel.subscriptionExpiresAt || hotel.subscription?.expiresAt;
  // Active if status is active and not expired
  return status === 'active' && (!expiresAt || new Date(expiresAt) > now);
}

async function resolveHotelId(req) {
  if (req.query.roomUuid) {
    const room = await Room.findOne({ uuid: req.query.roomUuid, active: true }).populate('hotelId');
    if (!room?.hotelId) return null;
    // For now, always return hotelId for testing single subscription model
    return room.hotelId._id;
  }
  if (req.query.hotelSlug) {
    const hotel = await Hotel.findOne({ slug: req.query.hotelSlug, active: true });
    if (!hotel) return null;
    // For now, always return hotelId for testing single subscription model
    return hotel._id;
  }
  if (req.query.hotelId) {
    if (!mongoose.isValidObjectId(req.query.hotelId)) return null;
    const hotel = await Hotel.findOne({ _id: req.query.hotelId, active: true });
    if (!hotel) return null;
    // For now, always return hotelId for testing single subscription model
    return hotel._id;
  }
  return null;
}

router.get('/', publicLimiter, async (req, res) => {
  try {
    const hotelId = await resolveHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ message: 'Valid hotel identifier required' });
    }
    const items = await MenuItem.find({ available: true, hotelId })
      .sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Menu error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
