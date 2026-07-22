const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');

async function resolveHotelId(req) {
  if (req.query.roomUuid) {
    const room = await Room.findOne({ uuid: req.query.roomUuid, active: true });
    return room?.hotelId;
  }
  if (req.query.hotelId) return req.query.hotelId;
  if (req.query.hotelSlug) {
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findOne({ slug: req.query.hotelSlug });
    return hotel?._id;
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const hotelId = await resolveHotelId(req);
    const filter = { available: true };
    if (hotelId) filter.hotelId = hotelId;
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
