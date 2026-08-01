const Hotel = require('../models/Hotel');

async function checkSubscriptionStatus(req, res, next) {
  if (!req.hotelId) return next();
  const hotel = await Hotel.findById(req.hotelId);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

  const now = new Date();
  const isActive = hotel.subscription?.status === 'ACTIVE' ||
    (hotel.subscription?.status === 'TRIAL' && hotel.subscription?.trialEndsAt && hotel.subscription.trialEndsAt > now);

  if (!isActive) {
    return res.status(403).json({ message: 'Subscription expired or cancelled. Please renew your plan.' });
  }
  next();
}

module.exports = checkSubscriptionStatus;
