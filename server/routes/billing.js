const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const billing = require('../services/billing');

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

// Admin / kitchen routes
router.use(requireAuth);
router.use(setHotel);

router.put('/info',
  body('billingPhone').optional().trim().escape(),
  body('billingEmail').optional().trim().escape().isEmail(),
  body('billingOperator').optional().trim().isIn(['togocel', 'moov', '']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const updates = {};
      if (req.body.billingPhone !== undefined) updates.billingPhone = req.body.billingPhone;
      if (req.body.billingEmail !== undefined) updates.billingEmail = req.body.billingEmail;
      if (req.body.billingOperator !== undefined) updates.billingOperator = req.body.billingOperator;
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

router.post('/initiate',
  body('phone').optional().trim().escape(),
  body('operator').optional().trim().isIn(['togocel', 'moov', '']),
  body('type').optional().trim().isIn(['trial_to_active', 'renewal']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const type = req.body.type || 'renewal';
      const payment = await billing.initiatePayment(req.hotelId, req.body.phone, type, req.body.operator);
      res.json(payment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.post('/refresh',
  body('transref').trim().notEmpty(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const payment = await billing.syncPaymentStatus(req.body.transref);
      res.json(payment);
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
