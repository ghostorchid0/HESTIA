const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const Settings = require('../models/Settings');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { requireAuth, requireRole } = require('../middleware/auth');

async function resolveHotelId(req) {
  if (req.query.roomUuid) {
    const room = await Room.findOne({ uuid: req.query.roomUuid, active: true });
    return room?.hotelId;
  }
  if (req.query.hotelId) {
    if (!mongoose.isValidObjectId(req.query.hotelId)) return null;
    const hotel = await Hotel.findOne({ _id: req.query.hotelId, active: true });
    return hotel?._id;
  }
  if (req.query.hotelSlug) {
    const hotel = await Hotel.findOne({ slug: req.query.hotelSlug, active: true });
    return hotel?._id;
  }
  const headerHotel = req.headers['x-hotel-id'];
  if (headerHotel && mongoose.isValidObjectId(headerHotel)) {
    const hotel = await Hotel.findOne({ _id: headerHotel, active: true });
    return hotel?._id;
  }
  return null;
}

router.get('/', async (req, res) => {
  const hotelId = await resolveHotelId(req);
  const query = hotelId ? { hotelId } : {};
  const settings = await Settings.findOne(query).sort({ createdAt: -1 });
  if (!settings) {
    const hotel = hotelId ? await Hotel.findById(hotelId) : null;
    return res.json({
      hotelId,
      hotelName: hotel?.name || 'Hestia',
      currency: hotel?.currency || 'XOF',
      contactPhone: hotel?.contactPhone || '',
      address: hotel?.address || '',
    });
  }
  res.json(settings);
});

router.put('/',
  requireAuth,
  requireRole('admin'),
  body('hotelName').optional().trim().notEmpty().escape(),
  body('currency').optional().trim().escape(),
  body('contactPhone').optional().trim().escape(),
  body('address').optional().trim().escape(),
  async (req, res) => {
    const isSuperadmin = req.user.role === 'superadmin';
    const headerHotel = req.headers['x-hotel-id'] || req.query.hotelId;
    if (headerHotel && !mongoose.isValidObjectId(headerHotel)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }
    const hotelId = isSuperadmin && headerHotel ? headerHotel : req.user.hotelId;
    if (!hotelId) return res.status(400).json({ message: 'Hotel ID required' });

    const updates = {};
    ['hotelName', 'currency', 'contactPhone', 'address'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const settings = await Settings.findOneAndUpdate(
      { hotelId },
      updates,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  });

module.exports = router;
