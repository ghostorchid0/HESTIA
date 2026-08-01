const express = require('express');
const { body, param, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const fsp = require('fs/promises');
const router = express.Router();
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const checkRoomLimit = require('../middleware/checkRoomLimit');
const checkSubscriptionStatus = require('../middleware/checkSubscriptionStatus');
const { hasFeature, featureTiers } = require('../middleware/hasFeature');
const upload = require('../middleware/upload');
const { notifyRoom } = require('../services/push');
const { sendSms } = require('../services/sms');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Settings = require('../models/Settings');

const allowedMenuFields = ['name', 'description', 'price', 'category', 'department', 'available', 'imageUrl'];

function pickMenuFields(source) {
  const picked = {};
  for (const key of allowedMenuFields) {
    if (source[key] !== undefined) picked[key] = source[key];
  }
  return picked;
}

async function fileToDataUrl(file) {
  const buffer = await fsp.readFile(file.path);
  try {
    await fsp.unlink(file.path);
  } catch (err) {
    console.error('Failed to delete uploaded file:', err.message);
  }
  return `data:${file.mimetype};base64,${buffer.toString('base64')}`;
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

router.use((req, res, next) => {
  const isSuperadmin = req.user.role === 'superadmin';
  const headerHotel = req.headers['x-hotel-id'] || req.query.hotelId;
  if (headerHotel && !mongoose.isValidObjectId(headerHotel)) {
    return res.status(400).json({ message: 'Invalid hotel id' });
  }
  if (isSuperadmin && headerHotel) {
    req.hotelId = headerHotel;
  } else {
    req.hotelId = req.user.hotelId;
  }
  next();
});

router.use(async (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  return checkSubscriptionStatus(req, res, next);
});

function hotelFilter(req) {
  return req.hotelId ? { hotelId: req.hotelId } : {};
}

router.get('/orders',
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('status').optional().isIn(['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { status, limit = 100 } = req.query;
    const filter = { ...hotelFilter(req) };
    if (status) filter.status = status;
    const role = req.user.role;
    if (['kitchen', 'reception'].includes(role)) {
      filter['items.department'] = role;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(orders);
  });

router.patch(
  '/orders/:id/status',
  requireRole('admin', 'kitchen', 'reception'),
  param('id').isMongoId(),
  body('status').isIn(['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const order = await Order.findOne({ _id: req.params.id, ...hotelFilter(req) });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === req.body.status) return res.json(order);

    order.status = req.body.status;
    if (req.body.status === 'Delivered') order.paymentStatus = 'Paid';
    if (req.body.status === 'Cancelled') order.paymentStatus = 'Pending';
    order.history.push({ status: req.body.status, changedBy: req.user.username || 'staff' });
    await order.save();

    const io = req.app.get('io');
    const orderDepts = [...new Set(order.items.map(i => i.department))];
    io.to(`room_${order.roomUuid}`).emit('order_status_updated', order.toObject());
    orderDepts.forEach((dept) => io.to(`${dept}_${order.hotelId}`).emit('order_status_updated', order.toObject()));

    notifyRoom(order.roomUuid, {
      title: 'Hestia',
      body: `Order status updated to ${order.status}`,
      data: { orderId: order._id.toString(), status: order.status },
    }).catch(err => console.error('Failed to send push:', err));

    try {
      const hotel = await Hotel.findById(order.hotelId);
      if (hotel?.contactPhone && ['Delivered', 'Cancelled'].includes(order.status)) {
        await sendSms(hotel.contactPhone, `Commande Hestia chambre ${order.roomNumber} - ${order.status}`);
      }
    } catch (err) {
      console.error('SMS notification error:', err);
    }

    res.json(order);
  }
);

router.patch(
  '/orders/:id/payment',
  requireRole('admin', 'kitchen', 'reception'),
  param('id').isMongoId(),
  body('paymentStatus').isIn(['Pending', 'Paid']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const order = await Order.findOne({ _id: req.params.id, ...hotelFilter(req) });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === req.body.paymentStatus) return res.json(order);

    order.paymentStatus = req.body.paymentStatus;
    await order.save();

    const io = req.app.get('io');
    const orderDepts = [...new Set(order.items.map(i => i.department))];
    io.to(`room_${order.roomUuid}`).emit('order_status_updated', order.toObject());
    orderDepts.forEach((dept) => io.to(`${dept}_${order.hotelId}`).emit('order_status_updated', order.toObject()));
    res.json(order);
  }
);

router.get('/rooms', requireRole('admin'), async (req, res) => {
  const rooms = await Room.find(hotelFilter(req)).sort({ number: 1 });
  res.json(rooms);
});

router.post('/rooms',
  requireRole('admin'),
  body('number').trim().notEmpty().escape(),
  checkRoomLimit,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const room = await Room.create({ hotelId: req.hotelId, uuid: uuidv4(), number: req.body.number, active: true });
    res.status(201).json(room);
  });

router.patch('/rooms/:id/toggle',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const room = await Room.findOne({ _id: req.params.id, ...hotelFilter(req) });
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
    const room = await Room.findOne({ _id: req.params.id, ...hotelFilter(req) });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const fallbackBase = `${protocol}://${req.get('host')}`;
    let baseUrl;
    if (config.clientUrl === '*') {
      baseUrl = fallbackBase;
    } else {
      const allowed = new URL(config.clientUrl).origin;
      if (req.query.baseUrl) {
        try {
          const provided = new URL(req.query.baseUrl).origin;
          baseUrl = provided === allowed ? provided : allowed;
        } catch {
          baseUrl = allowed;
        }
      } else {
        baseUrl = allowed;
      }
    }
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
  const items = await MenuItem.find(hotelFilter(req)).sort({ category: 1, name: 1 });
  res.json(items);
});

const menuValidation = [
  body('name').trim().notEmpty().escape(),
  body('description').optional().trim().escape(),
  body('price').isFloat({ min: 0 }).toFloat(),
  body('category').trim().notEmpty().escape(),
  body('department').optional().isIn(['kitchen', 'reception']),
  body('available').optional().isBoolean().toBoolean(),
  body('imageUrl').optional().trim().custom((value) => {
    if (!value) return true;
    if (value.startsWith('data:image/')) return true;
    if (value.startsWith('https://')) return true;
    throw new Error('imageUrl must be an HTTPS or data URL');
  }),
];

router.post('/menu', requireRole('admin'), upload.single('image'), menuValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  if (req.file) req.body.imageUrl = await fileToDataUrl(req.file);
  const item = await MenuItem.create({ ...pickMenuFields(req.body), hotelId: req.hotelId });
  res.status(201).json(item);
});

router.put('/menu/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  upload.single('image'),
  menuValidation,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    if (req.file) req.body.imageUrl = await fileToDataUrl(req.file);
    const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, ...hotelFilter(req) }, pickMenuFields(req.body), { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  });

router.delete('/menu/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    await MenuItem.findOneAndDelete({ _id: req.params.id, ...hotelFilter(req) });
    res.json({ message: 'Deleted' });
  });

router.get('/analytics', requireRole('admin'), async (req, res) => {
  const baseFilter = hotelFilter(req);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const paidFilter = { ...baseFilter, paymentStatus: 'Paid' };

  const [totalOrders, deliveredOrders, paidOrders, revenueAgg, recentOrders, topItems, categorySales, revenueByDay] = await Promise.all([
    Order.countDocuments(baseFilter),
    Order.countDocuments({ ...baseFilter, status: 'Delivered' }),
    Order.countDocuments(paidFilter),
    Order.aggregate([{ $match: paidFilter }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find(baseFilter).sort({ createdAt: -1 }).limit(10),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.department',
          category: { $first: '$items.department' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const revenue = revenueAgg.length ? revenueAgg[0].total : 0;

  // Fill missing days with 0 for the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }).reverse();
  const revenueByDayMap = Object.fromEntries(revenueByDay.map(d => [d.date, { date: d.date, revenue: d.revenue, orders: d.orders }]));
  const filledRevenueByDay = days.map(d => revenueByDayMap[d] || { date: d, revenue: 0, orders: 0 });

  res.json({
    totalOrders,
    deliveredOrders,
    paidOrders,
    revenue,
    recentOrders,
    topItems,
    categorySales,
    revenueByDay: filledRevenueByDay,
  });
});

router.get('/analytics/rush', requireRole('admin'), async (req, res) => {
  const matchStage = { $match: hotelFilter(req) };
  const [hourly, daily, monthly, yearly] = await Promise.all([
    Order.aggregate([matchStage, { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([matchStage, { $group: { _id: { $mod: [{ $add: [{ $dayOfWeek: '$createdAt' }, 5] }, 7] }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([matchStage, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([matchStage, { $group: { _id: { $year: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);

  const formatHour = (h) => `${String(h).padStart(2, '0')}:00`;
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  res.json({
    hourly: hourly.map(h => ({ hour: h._id, label: formatHour(h._id), count: h.count })),
    daily: daily.map(d => ({ day: d._id, label: daysOfWeek[d._id] || d._id, count: d.count })),
    monthly: monthly.map(m => ({ month: m._id, label: m._id, count: m.count })),
    yearly: yearly.map(y => ({ year: y._id, label: String(y._id), count: y.count })),
  });
});

function getPeriodBounds(dateStr, period) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(base.getTime())) return null;

  switch (period) {
    case 'day':
      return {
        start: new Date(Date.UTC(y, m - 1, d)),
        end: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)),
      };
    case 'week': {
      const dayOfWeek = base.getUTCDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const start = new Date(Date.UTC(y, m - 1, d - diffToMonday));
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start, end };
    }
    case 'month':
      return {
        start: new Date(Date.UTC(y, m - 1, 1)),
        end: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)),
      };
    case 'year':
      return {
        start: new Date(Date.UTC(y, 0, 1)),
        end: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)),
      };
    default:
      return null;
  }
}

router.get('/analytics/sales',
  requireRole('admin'),
  query('date').isISO8601().toDate(),
  query('period').isIn(['day', 'week', 'month', 'year']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const { date, period } = req.query;
    const dateStr = new Date(date).toISOString().split('T')[0];
    const bounds = getPeriodBounds(dateStr, period);
    if (!bounds) return res.status(400).json({ message: 'Invalid date or period' });

    const matchStage = {
      ...hotelFilter(req),
      createdAt: { $gte: bounds.start, $lte: bounds.end },
      paymentStatus: 'Paid',
    };

    const [orders, totals, topItems, categorySales] = await Promise.all([
      Order.find(matchStage).sort({ createdAt: -1 }),
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
          },
        },
      ]),
      Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'menuitems',
            localField: 'items.menuItemId',
            foreignField: '_id',
            as: 'menuItem',
          },
        },
        { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$items.menuItemId',
            name: { $first: '$items.name' },
            category: { $first: '$menuItem.category' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
      ]),
      Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'menuitems',
            localField: 'items.menuItemId',
            foreignField: '_id',
            as: 'menuItem',
          },
        },
        { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$menuItem.category',
            category: { $first: '$menuItem.category' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const summary = totals[0] || { totalOrders: 0, totalRevenue: 0 };

    res.json({
      period,
      start: bounds.start,
      end: bounds.end,
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      averageOrderValue: summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0,
      topItems,
      categorySales: categorySales.filter(c => c.category),
      orders,
    });
  });

router.get('/users', requireRole('admin'), async (req, res) => {
  const filter = req.user.role === 'superadmin' ? {} : hotelFilter(req);
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/users',
  requireRole('admin'),
  body('username').trim().notEmpty().escape().isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'kitchen', 'reception']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { username, password, role } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Username already exists' });
    const userHotelId = req.user.role === 'superadmin' ? (req.body.hotelId || req.hotelId) : req.hotelId;
    const user = await User.create({ username, password, role, hotelId: userHotelId });
    res.status(201).json({ _id: user._id, username: user.username, role: user.role, hotelId: user.hotelId, createdAt: user.createdAt });
  });

router.delete('/users/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const filter = { _id: req.params.id };
    if (req.user.role !== 'superadmin') filter.hotelId = req.hotelId;
    const user = await User.findOneAndDelete(filter);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Deleted' });
  });

router.get('/hotels', requireRole('superadmin'), async (req, res) => {
  const hotels = await Hotel.find().sort({ createdAt: -1 });
  res.json(hotels);
});

router.post('/hotels',
  requireRole('superadmin'),
  body('name').trim().notEmpty().escape(),
  body('slug').trim().notEmpty().escape().matches(/^[a-z0-9-]+$/),
  body('currency').optional().trim().escape(),
  body('contactPhone').optional().trim().escape(),
  body('address').optional().trim().escape(),
  body('adminUsername').optional().trim().notEmpty().escape(),
  body('adminPassword').optional().trim().isLength({ min: 6 }),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { name, slug, currency, contactPhone, address, adminUsername, adminPassword } = req.body;
    const existing = await Hotel.findOne({ slug: slug.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Slug already exists' });

    const hotel = await Hotel.create({ name, slug: slug.toLowerCase(), currency, contactPhone, address });
    await Settings.create({ hotelId: hotel._id, hotelName: name, currency: currency || 'XOF' });

    let admin = null;
    if (adminUsername && adminPassword) {
      const existingUser = await User.findOne({ username: adminUsername });
      if (existingUser) {
        await Hotel.findByIdAndDelete(hotel._id);
        await Settings.findOneAndDelete({ hotelId: hotel._id });
        return res.status(409).json({ message: 'Admin username already exists' });
      }
      admin = await User.create({ username: adminUsername, password: adminPassword, role: 'admin', hotelId: hotel._id });
    }

    res.status(201).json({ hotel, admin: admin ? { username: admin.username, role: admin.role, hotelId: admin.hotelId } : null });
  });

router.get('/orders/export', requireRole('admin', 'kitchen'), async (req, res) => {
  const orders = await Order.find(hotelFilter(req)).sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hestia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 28 },
    { header: 'Room', key: 'room', width: 12 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Payment Method', key: 'paymentMethod', width: 20 },
    { header: 'Payment Status', key: 'paymentStatus', width: 16 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Items', key: 'items', width: 50 },
    { header: 'Notes', key: 'notes', width: 40 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1A2A' } };
    cell.font = { bold: true, color: { argb: 'FFC9A227' }, size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  orders.forEach(order => {
    sheet.addRow({
      orderId: order._id.toString(),
      room: order.roomNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      items: order.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
      notes: order.notes || '',
      createdAt: order.createdAt,
    });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const statusCell = row.getCell('status');
    const statusStyles = {
      Received: 'FF0B1A2A',
      Preparing: 'FFB45309',
      'On the way': 'FFC9A227',
      Delivered: 'FF166534',
      Cancelled: 'FF991B1B',
    };
    if (statusStyles[statusCell.value]) {
      statusCell.font = { bold: true, color: { argb: statusStyles[statusCell.value] } };
    }

    const totalCell = row.getCell('total');
    totalCell.numFmt = '$#,##0.00';
    totalCell.alignment = { horizontal: 'right' };

    const createdCell = row.getCell('createdAt');
    createdCell.numFmt = 'yyyy-mm-dd hh:mm:ss';
    createdCell.alignment = { horizontal: 'center' };

    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F5F0' } };
      });
    }
  });

  sheet.autoFilter = { from: 'A1', to: 'I1' };
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="hestia-orders.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

function getFeatureFlags(plan) {
  const flags = {};
  for (const [feature, plans] of Object.entries(featureTiers)) {
    flags[feature] = plans.includes(plan);
  }
  return flags;
}

router.get('/subscription', requireRole('admin'), async (req, res) => {
  const hotel = await Hotel.findById(req.hotelId).lean();
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  const used = await Room.countDocuments({ hotelId: req.hotelId, active: true });
  const now = new Date();
  const trialEndsAt = hotel.subscription?.trialEndsAt;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt) - now) / (1000 * 60 * 60 * 24))) : 0;
  res.json({
    subscription: hotel.subscription,
    rooms: { used, max: hotel.subscription?.maxRoomsAllowed || 12 },
    trialDaysLeft,
    features: getFeatureFlags(hotel.subscription?.plan),
  });
});

router.patch('/subscription/upgrade',
  requireRole('admin'),
  body('plan').isIn(['STARTER', 'PRO', 'ENTERPRISE']),
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    hotel.subscription.plan = req.body.plan;
    if (hotel.subscription.status === 'TRIAL' || hotel.subscription.status === 'PAST_DUE') {
      hotel.subscription.status = 'ACTIVE';
    }
    await hotel.save();
    res.json({
      subscription: hotel.subscription,
      features: getFeatureFlags(hotel.subscription.plan),
    });
  });

module.exports = router;
