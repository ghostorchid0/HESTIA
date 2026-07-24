const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const { requestPayment, getTransactionStatus, normalizeMsisdn, detectOperator } = require('./qosic');
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
    price: config.billing.price,
    currency: config.billing.currency,
  };
}

async function initiatePayment(hotelId, phone, type = 'renewal', providedOperator = '') {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new Error('Hotel not found');

  const msisdn = normalizeMsisdn(phone || hotel.billingPhone);
  if (!msisdn) throw new Error('Phone number required');

  const operator = providedOperator || detectOperator(msisdn) || hotel.billingOperator;
  if (!operator) throw new Error('Operator could not be detected. Please select Togocel or Moov.');

  const transref = generateTransref(hotel._id);
  const payment = await Payment.create({
    hotelId,
    amount: config.billing.price,
    currency: config.billing.currency,
    status: 'pending',
    operator,
    msisdn,
    transref,
    type,
  });

  const qosicRes = await requestPayment(msisdn, config.billing.price, transref, operator);
  payment.qosicResponse = qosicRes;
  await payment.save();

  return payment;
}

async function syncPaymentStatus(transref) {
  const payment = await Payment.findOne({ transref });
  if (!payment) throw new Error('Payment not found');
  if (payment.status === 'success') return payment;

  const qosicRes = await getTransactionStatus(transref);
  payment.qosicResponse = qosicRes;

  if (qosicRes.responsecode === '00') {
    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();
    await activateSubscription(payment.hotelId, payment);
  } else if (qosicRes.responsecode && qosicRes.responsecode !== '01') {
    payment.status = 'failed';
    await payment.save();
  }

  return payment;
}

async function activateSubscription(hotelId, payment) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return;

  const now = new Date();
  const expiry = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
  hotel.subscriptionStatus = 'active';
  hotel.subscriptionExpiresAt = expiry;
  hotel.lastPaymentAt = now;
  if (payment && payment.msisdn) hotel.billingPhone = payment.msisdn;
  if (payment && payment.operator) hotel.billingOperator = payment.operator;
  await hotel.save();

  await notifySubscriptionEvent(
    hotel,
    'Votre abonnement Hestia est actif',
    `Bonjour ${hotel.name}, votre paiement de ${payment ? payment.amount : config.billing.price} ${config.billing.currency} a été reçu. Votre abonnement est actif jusqu'au ${expiry.toLocaleDateString('fr-FR')}.`
  );
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
    operator: hotel.billingOperator || 'togocel',
    msisdn: hotel.billingPhone || '',
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
    'Votre abonnement Hestia est en attente de paiement',
    `Bonjour ${hotel.name}, votre abonnement est en attente de paiement. Veuillez régler ${config.billing.price} ${config.billing.currency} pour continuer à utiliser Hestia.`
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
    `Bonjour ${hotel.name}, votre accès Hestia est désormais en lecture seule suite à l'absence de paiement. Contactez le support pour réactiver.`
  );
  return hotel;
}

async function getPayments(hotelId) {
  return Payment.find({ hotelId }).sort({ createdAt: -1 });
}

module.exports = {
  getHotelSubscription,
  initiatePayment,
  syncPaymentStatus,
  activateSubscription,
  manualActivation,
  extendTrial,
  setPastDue,
  cancelSubscription,
  getPayments,
  normalizeMsisdn,
  detectOperator,
};
