const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const billing = require('../services/billing');
const chariow = require('../services/chariow');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    return false;
  }
  return true;
}

function setHotel(req, res, next) {
  const isSuperadmin = req.user.role === 'superadmin';
  const headerHotel = req.headers['x-hotel-id'] || req.query.hotelId;
  if (headerHotel && !mongoose.isValidObjectId(headerHotel)) {
    return res.status(400).json({ message: 'Invalid hotel id' });
  }
  req.hotelId = isSuperadmin && headerHotel ? headerHotel : req.user.hotelId;
  next();
}

// Public Chariow webhook (no auth)
router.post('/chariow', async (req, res) => {
  try {
    const event = req.body?.event || req.body?.data?.event;
    const licenseKey = req.body?.license?.key || req.body?.data?.license?.key;

    if (!licenseKey) {
      return res.status(400).json({ message: 'License key not found in payload' });
    }

    // Optional signature check
    const signature = req.headers['x-chariow-signature'] || req.headers['x-pulse-signature'];
    if (config.chariow.webhookSecret && !chariow.verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    if (event === 'license.activated' || event === 'license.issued' || event === 'license.renewed') {
      const hotel = await billing.applyLicenseFromWebhook(licenseKey, req.body);
      return res.json({ message: 'License activated', hotelId: hotel._id });
    }

    if (event === 'license.expired' || event === 'license.revoked') {
      const hotel = await billing.applyLicenseFromWebhook(licenseKey, req.body);
      return res.json({ message: 'License expired/revoked', hotelId: hotel._id });
    }

    res.json({ message: 'Event ignored' });
  } catch (err) {
    console.error('[chariow webhook]', err.message);
    res.status(400).json({ message: err.message });
  }
});

// Admin / kitchen routes
router.use(requireAuth);
router.use(setHotel);

router.put('/info',
  body('billingPhone').optional().trim().escape(),
  body('billingEmail').optional().trim().escape().isEmail(),
  body('billingOperator').optional().trim().isIn(['togocel', 'moov', '']),
  body('chariowLicenseKey').optional().trim().escape(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const updates = {};
      if (req.body.billingPhone !== undefined) updates.billingPhone = req.body.billingPhone;
      if (req.body.billingEmail !== undefined) updates.billingEmail = req.body.billingEmail;
      if (req.body.billingOperator !== undefined) updates.billingOperator = req.body.billingOperator;
      if (req.body.chariowLicenseKey !== undefined) updates.chariowLicenseKey = req.body.chariowLicenseKey;
      const hotel = await require('../models/Hotel').findByIdAndUpdate(req.hotelId, updates, { new: true });
      res.json(hotel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.get('/state', async (req, res) => {
  try {
    const state = await billing.getHotelSubscription(req.hotelId);
    res.json(state);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await billing.getPayments(req.hotelId);
    res.json(payments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/activate',
  body('licenseKey').trim().notEmpty(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const result = await billing.activateWithLicense(req.hotelId, req.body.licenseKey);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

// Superadmin routes
router.get('/admin/hotels', requireRole('superadmin'), async (req, res) => {
  const hotels = await require('../models/Hotel').find().sort({ createdAt: -1 });
  res.json(hotels);
});

router.get('/admin/payments/:hotelId',
  requireRole('superadmin'),
  param('hotelId').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const payments = await billing.getPayments(req.params.hotelId);
      res.json(payments);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.post('/admin/:hotelId/activate',
  requireRole('superadmin'),
  param('hotelId').isMongoId(),
  body('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const hotel = await billing.manualActivation(req.params.hotelId, req.body.days);
      res.json(hotel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.post('/admin/:hotelId/extend-trial',
  requireRole('superadmin'),
  param('hotelId').isMongoId(),
  body('days').isInt({ min: 1, max: 365 }).toInt(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const hotel = await billing.extendTrial(req.params.hotelId, req.body.days);
      res.json(hotel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.post('/admin/:hotelId/cancel',
  requireRole('superadmin'),
  param('hotelId').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const hotel = await billing.cancelSubscription(req.params.hotelId);
      res.json(hotel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;
