const express = require('express');
const { body, param, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const router = express.Router();
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');

const allowedMenuFields = ['name', 'description', 'price', 'category', 'available', 'imageUrl'];

function pickMenuFields(source) {
  const picked = {};
  for (const key of allowedMenuFields) {
    if (source[key] !== undefined) picked[key] = source[key];
  }
  return picked;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    return false;
  }
  return true;
}

router.use(requireAuth);

router.get('/orders', async (req, res) => {
  const { status, limit = 100 } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
  res.json(orders);
});

router.patch(
  '/orders/:id/status',
  requireRole('admin', 'kitchen'),
  param('id').isMongoId(),
  body('status').isIn(['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        $push: { history: { status: req.body.status, changedBy: req.user.username || 'staff' } },
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.to(`room_${order.roomUuid}`).emit('order_status_updated', order.toObject());
    io.to('kitchen').emit('order_status_updated', order.toObject());

    res.json(order);
  }
);

router.get('/rooms', requireRole('admin'), async (req, res) => {
  const rooms = await Room.find().sort({ number: 1 });
  res.json(rooms);
});

router.post('/rooms',
  requireRole('admin'),
  body('number').trim().notEmpty().escape(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const room = await Room.create({ uuid: uuidv4(), number: req.body.number, active: true });
    res.status(201).json(room);
  });

router.patch('/rooms/:id/toggle',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.active = !room.active;
    await room.save();
    res.json(room);
  });

router.get('/rooms/:id/qr',
  requireRole('admin'),
  param('id').isMongoId(),
  query('size').optional().isInt({ min: 50, max: 1000 }).toInt(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const fallbackBase = `${protocol}://${req.get('host')}`;
    const baseUrl = req.query.baseUrl || (config.clientUrl === '*' ? fallbackBase : config.clientUrl) || fallbackBase;
    const url = `${baseUrl}/room/${room.uuid}`;
    const size = req.query.size || 200;

    try {
      const dataUrl = await QRCode.toDataURL(url, { width: size, margin: 2, errorCorrectionLevel: 'M' });
      res.json({ url, dataUrl, size });
    } catch (err) {
      res.status(500).json({ message: 'Failed to generate QR code' });
    }
  });

router.get('/menu', requireRole('admin'), async (req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 });
  res.json(items);
});

const menuValidation = [
  body('name').trim().notEmpty().escape(),
  body('description').optional().trim().escape(),
  body('price').isFloat({ min: 0 }).toFloat(),
  body('category').trim().notEmpty().escape(),
  body('available').optional().isBoolean().toBoolean(),
  body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be a valid URL'),
];

router.post('/menu', requireRole('admin'), menuValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  const item = await MenuItem.create(pickMenuFields(req.body));
  res.status(201).json(item);
});

router.put('/menu/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  menuValidation,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, pickMenuFields(req.body), { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  });

router.delete('/menu/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  });

router.get('/analytics', requireRole('admin'), async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
  const revenue = await Order.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);
  res.json({
    totalOrders,
    deliveredOrders,
    revenue: revenue.length ? revenue[0].total : 0,
    recentOrders,
  });
});

module.exports = router;
