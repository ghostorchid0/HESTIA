const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

async function checkRoomLimit(req, res, next) {
  if (!req.hotelId) return next();
  const hotel = await Hotel.findById(req.hotelId).lean();
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

  const max = hotel.subscription?.maxRoomsAllowed || 12;
  const count = await Room.countDocuments({ hotelId: req.hotelId, active: true });
  if (count >= max) {
    return res.status(403).json({
      error: 'ROOM_LIMIT_REACHED',
      message: 'Upgrade your subscription plan to add more rooms.',
    });
  }
  req.roomLimit = { used: count, max };
  next();
}

module.exports = checkRoomLimit;
