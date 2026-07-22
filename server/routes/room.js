const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const validateRoom = require('../middleware/validateRoom');

router.get('/:uuid', validateRoom, async (req, res) => {
  res.json({ valid: true, room: { uuid: req.room.uuid, number: req.room.number } });
});

module.exports = router;
