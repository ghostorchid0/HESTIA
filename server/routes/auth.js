const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const config = require('../config');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id, role: user.role, username: user.username, hotelId: user.hotelId?.toString() }, config.jwtSecret, { expiresIn: '12h' });
  res.json({ token, role: user.role, username: user.username, hotelId: user.hotelId?.toString() });
});

module.exports = router;
