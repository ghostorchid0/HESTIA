const cron = require('node-cron');
const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const billing = require('../services/billing');
const { notifySubscriptionEvent } = require('../services/notify');
const config = require('../config');

const REMINDER_DAYS = 3;
const GRACE_DAYS = 3;
const PAYMENT_POLL_MINUTES = 5;

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function sendTrialReminders() {
  const now = new Date();
  const target = addDays(now, REMINDER_DAYS);
  const start = new Date(target.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(target.getTime() + 12 * 60 * 60 * 1000);

  const hotels = await Hotel.find({
    subscriptionStatus: 'trial',
    trialEndsAt: { $gte: start, $lte: end },
  });

  for (const hotel of hotels) {
    await notifySubscriptionEvent(
      hotel,
      'Votre essai Hestia expire bientôt',
      `Bonjour ${hotel.name}, votre essai Hestia expire dans ${REMINDER_DAYS} jours. Activez votre abonnement pour ${config.billing.price} ${config.billing.currency} et continuez à recevoir des commandes.`
    );
  }
}

async function sendRenewalReminders() {
  const now = new Date();
  const target = addDays(now, REMINDER_DAYS);
  const start = new Date(target.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(target.getTime() + 12 * 60 * 60 * 1000);

  const hotels = await Hotel.find({
    subscriptionStatus: 'active',
    subscriptionExpiresAt: { $gte: start, $lte: end },
  });

  for (const hotel of hotels) {
    await notifySubscriptionEvent(
      hotel,
      'Renouvellement de votre abonnement Hestia',
      `Bonjour ${hotel.name}, votre abonnement Hestia expire dans ${REMINDER_DAYS} jours. Réglez ${config.billing.price} ${config.billing.currency} pour éviter une interruption.`
    );
  }
}

async function handleExpiredSubscriptions() {
  const now = new Date();

  const activeExpired = await Hotel.find({
    subscriptionStatus: 'active',
    subscriptionExpiresAt: { $lte: now },
  });

  for (const hotel of activeExpired) {
    await billing.setPastDue(hotel._id);
  }

  const pastDueExpired = await Hotel.find({
    subscriptionStatus: 'past_due',
    subscriptionExpiresAt: { $lte: addDays(now, -GRACE_DAYS) },
  });

  for (const hotel of pastDueExpired) {
    await billing.cancelSubscription(hotel._id);
  }
}

async function pollPendingPayments() {
  const cutoff = new Date(Date.now() - PAYMENT_POLL_MINUTES * 60 * 1000);
  const payments = await Payment.find({
    status: 'pending',
    createdAt: { $lte: cutoff },
  });

  for (const payment of payments) {
    try {
      await billing.syncPaymentStatus(payment.transref);
    } catch (err) {
      console.error('[billingJobs] Failed to sync payment', payment.transref, err.message);
    }
  }
}

async function runDailyBillingJobs() {
  console.log('[billingJobs] Running daily billing jobs');
  try {
    await sendTrialReminders();
    await sendRenewalReminders();
    await handleExpiredSubscriptions();
  } catch (err) {
    console.error('[billingJobs] Daily jobs error:', err.message);
  }
}

async function runPaymentPolling() {
  try {
    await pollPendingPayments();
  } catch (err) {
    console.error('[billingJobs] Payment polling error:', err.message);
  }
}

function startBillingJobs() {
  // Daily at 09:00
  cron.schedule('0 9 * * *', runDailyBillingJobs, { timezone: 'Africa/Lome' });
  // Payment polling every 5 minutes
  cron.schedule('*/5 * * * *', runPaymentPolling, { timezone: 'Africa/Lome' });
  console.log('[billingJobs] Scheduled billing jobs');
}

module.exports = { startBillingJobs, runDailyBillingJobs, runPaymentPolling };
