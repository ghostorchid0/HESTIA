const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { sendSms } = require('../services/sms');
const validateRoom = require('../middleware/validateRoom');

const orderLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: 'Too many orders, please slow down.' },
});

router.post(
  '/',
  orderLimit,
  body('roomUuid').isString().trim().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.menuItemId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('paymentMethod').optional().isIn(['Cash on delivery', 'Mobile Money', 'Room charge']),
  body('notes').optional().isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { roomUuid, items, notes, paymentMethod } = req.body;

    const room = await Room.findOne({ uuid: roomUuid, active: true });
    if (!room) {
      return res.status(404).json({ message: 'Invalid or inactive room' });
    }

    const menuIds = items.map(i => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds }, hotelId: room.hotelId });
    const menuMap = new Map(menuItems.map(m => [m._id.toString(), m]));

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const menu = menuMap.get(item.menuItemId);
      if (!menu || !menu.available) {
        return res.status(400).json({ message: `Menu item unavailable: ${item.menuItemId}` });
      }
      const quantity = parseInt(item.quantity, 10);
      const lineTotal = menu.price * quantity;
      total += lineTotal;
      orderItems.push({
        menuItemId: menu._id,
        name: menu.name,
        price: menu.price,
        quantity,
        notes: item.notes || '',
      });
    }

    const order = await Order.create({
      hotelId: room.hotelId,
      roomUuid,
      roomNumber: room.number,
      items: orderItems,
      total,
      notes: notes || '',
      status: 'Received',
      paymentMethod: paymentMethod || 'Cash on delivery',
      paymentStatus: 'Pending',
      history: [{ status: 'Received', changedBy: 'guest' }],
    });

    const io = req.app.get('io');
    io.to('kitchen').emit('new_order', order.toObject());

    try {
      const hotel = await Hotel.findById(room.hotelId);
      if (hotel?.contactPhone) {
        await sendSms(hotel.contactPhone, `Nouvelle commande Hestia - Chambre ${room.number} - Total ${order.total} ${hotel.currency || ''}`);
      }
    } catch (err) {
      console.error('SMS notification error:', err);
    }

    res.status(201).json(order);
  }
);

router.get('/:id', async (req, res) => {
  const { roomUuid } = req.query;
  if (!roomUuid) return res.status(400).json({ message: 'roomUuid required' });
  const room = await Room.findOne({ uuid: roomUuid, active: true });
  if (!room) return res.status(404).json({ message: 'Invalid room' });
  const order = await Order.findOne({ _id: req.params.id, roomUuid });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

module.exports = router;
