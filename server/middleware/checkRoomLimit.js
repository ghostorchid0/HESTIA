const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

async function checkRoomLimit(req, res, next) {
  // Room limit disabled - unlimited rooms for all plans
  req.roomLimit = { used: 0, max: 9999 };
  next();
}

module.exports = checkRoomLimit;
