const express = require('express');
const { body, param, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const router = express.Router();
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { notifyRoom } = require('../services/push');
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

    notifyRoom(order.roomUuid, {
      title: 'Hestia',
      body: `Order status updated to ${order.status}`,
      data: { orderId: order._id.toString(), status: order.status },
    }).catch(err => console.error('Failed to send push:', err));

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
  body('imageUrl').optional().trim(),
];

router.post('/menu', requireRole('admin'), upload.single('image'), menuValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  if (req.file) req.body.imageUrl = `/uploads/${req.file.filename}`;
  const item = await MenuItem.create(pickMenuFields(req.body));
  res.status(201).json(item);
});

router.put('/menu/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  upload.single('image'),
  menuValidation,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    if (req.file) req.body.imageUrl = `/uploads/${req.file.filename}`;
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

router.get('/analytics/rush', requireRole('admin'), async (req, res) => {
  const [hourly, daily, monthly, yearly] = await Promise.all([
    Order.aggregate([
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $group: { _id: { $mod: [{ $add: [{ $dayOfWeek: '$createdAt' }, 5] }, 7] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $group: { _id: { $year: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
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

router.get('/orders/export', requireRole('admin'), async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hestia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 28 },
    { header: 'Room', key: 'room', width: 12 },
    { header: 'Status', key: 'status', width: 16 },
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

  sheet.autoFilter = { from: 'A1', to: 'G1' };
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="hestia-orders.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
