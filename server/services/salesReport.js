const mongoose = require('mongoose');
const Order = require('../models/Order');

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

function hotelIdFilter(hotelId) {
  if (!hotelId) return {};
  return mongoose.isValidObjectId(hotelId)
    ? { hotelId: new mongoose.Types.ObjectId(hotelId) }
    : {};
}

async function getSalesReport(hotelId, date, period) {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const bounds = getPeriodBounds(dateStr, period);
  if (!bounds) return null;

  const matchStage = {
    ...hotelIdFilter(hotelId),
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

  return {
    period,
    start: bounds.start,
    end: bounds.end,
    totalOrders: summary.totalOrders,
    totalRevenue: summary.totalRevenue,
    averageOrderValue: summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0,
    topItems,
    categorySales: categorySales.filter((c) => c.category),
    orders,
  };
}

module.exports = { getSalesReport, getPeriodBounds };
