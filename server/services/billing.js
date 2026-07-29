const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const chariow = require('./chariow');
const { notifySubscriptionEvent } = require('./notify');
const config = require('../config');

const SUBSCRIPTION_DAYS = 30;

function generateTransref(hotelId) {
  return `${hotelId.toString()}-${Date.now()}`;
}

async function getHotelSubscription(hotelId) {
  const hotel = await Hotel.findById(hotelId).select('-__v');
  if (!hotel) throw new Error('Hotel not found');
  return {
    status: hotel.subscriptionStatus,
    trialEndsAt: hotel.trialEndsAt,
    subscriptionExpiresAt: hotel.subscriptionExpiresAt,
    billingPhone: hotel.billingPhone,
    billingEmail: hotel.billingEmail,
    billingOperator: hotel.billingOperator,
    chariowLicenseKey: hotel.chariowLicenseKey,
    price: config.billing.price,
    customerPrice: config.billing.customerPrice,
    feePercent: config.billing.feePercent,
    currency: config.billing.currency,
    storeUrl: config.billing.storeUrl,
  };
}

async function activateWithLicense(hotelId, licenseKey) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new Error('Hotel not found');
  if (!licenseKey) throw new Error('License key required');

  const validation = await chariow.validateLicense(licenseKey);
  if (!validation.valid) {
    throw new Error(validation.isExpired ? 'License expired' : 'License is not active');
  }

  const expiry = validation.expiresAt ? new Date(validation.expiresAt) : new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  hotel.subscriptionStatus = 'active';
  hotel.subscriptionExpiresAt = expiry;
  hotel.lastPaymentAt = new Date();
  hotel.chariowLicenseKey = validation.key;
  await hotel.save();

  await Payment.create({
    hotelId,
    amount: config.billing.price,
    currency: config.billing.currency,
    status: 'success',
    provider: 'chariow',
    chariowLicenseKey: validation.key,
    chariowResponse: validation.raw,
    type: 'chariow_license',
    paidAt: new Date(),
  });

  await notifySubscriptionEvent(
    hotel,
    'Votre abonnement Hestia est actif',
    `Bonjour ${hotel.name}, votre licence Chariow est activée. Votre abonnement est valable jusqu'au ${expiry.toLocaleDateString('fr-FR')}.`
  );

  return { hotel, validation };
}

async function applyLicenseFromWebhook(licenseKey, chariowPayload) {
  const hotel = await Hotel.findOne({ chariowLicenseKey: licenseKey });
  if (!hotel) throw new Error('Hotel not found for this license key');

  const status = chariowPayload?.license?.status || chariowPayload?.status;
  const expiresAt = chariowPayload?.license?.expires_at || chariowPayload?.expires_at;
  const isActive = status === 'active';
  const isExpired = status === 'expired';

  if (isActive && expiresAt) {
    hotel.subscriptionStatus = 'active';
    hotel.subscriptionExpiresAt = new Date(expiresAt);
    hotel.lastPaymentAt = new Date();
    await hotel.save();
    await Payment.create({
      hotelId: hotel._id,
      amount: config.billing.price,
      currency: config.billing.currency,
      status: 'success',
      provider: 'chariow',
      chariowLicenseKey: licenseKey,
      chariowResponse: chariowPayload,
      type: 'chariow_license',
      paidAt: new Date(),
    });
  } else if (isExpired) {
    await setPastDue(hotel._id);
  }

  return hotel;
}

async function manualActivation(hotelId, days = SUBSCRIPTION_DAYS) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new Error('Hotel not found');

  const now = new Date();
  const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  hotel.subscriptionStatus = 'active';
  hotel.subscriptionExpiresAt = expiry;
  hotel.lastPaymentAt = now;
  await hotel.save();

  await Payment.create({
    hotelId,
    amount: 0,
    currency: config.billing.currency,
    status: 'success',
    provider: 'manual',
    transref: `manual-${Date.now()}`,
    type: 'manual',
    paidAt: now,
  });

  return hotel;
}

async function extendTrial(hotelId, days) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new Error('Hotel not found');

  const base = hotel.trialEndsAt && hotel.trialEndsAt > new Date() ? hotel.trialEndsAt : new Date();
  hotel.trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  await hotel.save();
  return hotel;
}

async function setPastDue(hotelId) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel || hotel.subscriptionStatus === 'cancelled') return hotel;

  hotel.subscriptionStatus = 'past_due';
  await hotel.save();

  await notifySubscriptionEvent(
    hotel,
    'Votre abonnement Hestia est en attente de renouvellement',
    `Bonjour ${hotel.name}, votre abonnement est en attente. Achetez une nouvelle licence sur Chariow pour continuer à utiliser Hestia.`
  );
  return hotel;
}

async function cancelSubscription(hotelId) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return;

  hotel.subscriptionStatus = 'cancelled';
  await hotel.save();

  await notifySubscriptionEvent(
    hotel,
    'Votre abonnement Hestia a été suspendu',
    `Bonjour ${hotel.name}, votre accès Hestia est désormais en lecture seule. Achetez une nouvelle licence pour réactiver.`
  );
  return hotel;
}

async function getPayments(hotelId) {
  return Payment.find({ hotelId }).sort({ createdAt: -1 });
}

module.exports = {
  getHotelSubscription,
  activateWithLicense,
  applyLicenseFromWebhook,
  manualActivation,
  extendTrial,
  setPastDue,
  cancelSubscription,
  getPayments,
};
