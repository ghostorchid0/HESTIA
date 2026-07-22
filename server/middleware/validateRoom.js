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
  req.room = room;
  next();
}

module.exports = validateRoom;
