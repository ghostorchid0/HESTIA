const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Settings = require('../models/Settings');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const settings = await Settings.findOne().sort({ createdAt: -1 });
  if (!settings) {
    const created = await Settings.create({ hotelName: 'Hestia' });
    return res.json(created);
  }
  res.json(settings);
});

router.put('/',
  requireAuth,
  requireRole('admin'),
  upload.single('logo'),
  body('hotelName').optional().trim().notEmpty().escape(),
  body('currency').optional().trim().escape(),
  body('contactPhone').optional().trim().escape(),
  body('address').optional().trim().escape(),
  async (req, res) => {
    const updates = {};
    ['hotelName', 'currency', 'contactPhone', 'address'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.file) {
      updates.hotelLogo = `/uploads/${req.file.filename}`;
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      updates,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  });

module.exports = router;
