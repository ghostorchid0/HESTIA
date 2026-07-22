const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/',
  body('orderId').isMongoId(),
  body('roomUuid').isString().trim().notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }).toInt(),
  body('comment').optional().isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

    const { orderId, roomUuid, rating, comment } = req.body;
    const order = await Order.findOne({ _id: orderId, roomUuid });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'Delivered') return res.status(400).json({ message: 'Order not delivered yet' });

    const existing = await Review.findOne({ orderId });
    if (existing) return res.status(409).json({ message: 'Review already submitted' });

    const review = await Review.create({
      hotelId: order.hotelId,
      orderId,
      roomUuid,
      roomNumber: order.roomNumber,
      rating,
      comment: comment || '',
    });
    res.status(201).json(review);
  });

router.get('/admin/reviews', requireAuth, requireRole('admin'), async (req, res) => {
  const filter = {};
  const hotelId = req.headers['x-hotel-id'] || req.user.hotelId;
  if (req.user.role !== 'superadmin' && hotelId) filter.hotelId = hotelId;
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(reviews);
});

module.exports = router;
