const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');

const featureTiers = {
  CUSTOM_BRANDING: ['PRO', 'ENTERPRISE'],
  AMENITIES_CATEGORY: ['PRO', 'ENTERPRISE'],
  MULTI_DEPARTMENT: ['PRO', 'ENTERPRISE'],
  REVENUE_DASHBOARD: ['PRO', 'ENTERPRISE'],
  CSV_EXPORT: ['PRO', 'ENTERPRISE'],
  MULTI_PROPERTY: ['ENTERPRISE'],
  WEBHOOKS: ['ENTERPRISE'],
  SMS_GUEST: ['ENTERPRISE'],
  CUSTOM_DOMAIN: ['ENTERPRISE'],
};

function resolveHotelId(req) {
  const isSuperadmin = req.user?.role === 'superadmin';
  const headerHotel = req.headers?.['x-hotel-id'] || req.query?.hotelId;
  if (headerHotel && !mongoose.isValidObjectId(headerHotel)) return null;
  return (isSuperadmin && headerHotel) || req.hotelId || req.user?.hotelId;
}

function hasFeature(feature) {
  return async (req, res, next) => {
    const hotelId = resolveHotelId(req);
    if (!hotelId) return next();
    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    const plan = hotel.subscription?.plan || 'STARTER';
    const allowed = featureTiers[feature] || [];
    if (!allowed.includes(plan)) {
      return res.status(403).json({ error: 'FEATURE_NOT_AVAILABLE', message: 'This feature requires a higher plan.' });
    }
    next();
  };
}

module.exports = { hasFeature, featureTiers };
