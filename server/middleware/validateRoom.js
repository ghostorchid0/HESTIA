const Room = require('../models/Room');

async function validateRoom(req, res, next) {
  const roomUuid = req.body?.roomUuid || req.params?.uuid;
  if (!roomUuid) {
    return res.status(400).json({ message: 'Room UUID is required' });
  }
  const room = await Room.findOne({ uuid: roomUuid, active: true }).populate('hotelId');
  if (!room) {
    return res.status(404).json({ message: 'Invalid or inactive room' });
  }

  const hotel = room.hotelId;
  const now = new Date();
  const isActive = hotel && (hotel.subscriptionStatus === 'active' ||
    (hotel.subscriptionStatus === 'trial' && hotel.trialEndsAt && hotel.trialEndsAt > now));
  if (!isActive) {
    return res.status(403).json({ message: 'This hotel service is temporarily unavailable.' });
  }

  req.room = room;
  next();
}

module.exports = validateRoom;
