const webpush = require('web-push');
const config = require('../config');
const PushSubscription = require('../models/PushSubscription');

const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.push.apple.com',
  'web.push.apple.com',
];

function isAllowedEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    return ALLOWED_PUSH_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

webpush.setVapidDetails(
  config.vapidSubject,
  config.vapidPublicKey,
  config.vapidPrivateKey
);

async function saveSubscription(roomUuid, subscription) {
  await PushSubscription.findOneAndUpdate(
    { roomUuid, endpoint: subscription.endpoint },
    { roomUuid, endpoint: subscription.endpoint, keys: subscription.keys },
    { upsert: true, new: true }
  );
}

async function removeSubscription(endpoint) {
  await PushSubscription.findOneAndDelete({ endpoint });
}

async function notifyRoom(roomUuid, payload) {
  const subs = await PushSubscription.find({ roomUuid });
  const data = JSON.stringify(payload);
  await Promise.all(subs.map(async (sub) => {
    if (!isAllowedEndpoint(sub.endpoint)) {
      await removeSubscription(sub.endpoint);
      return;
    }
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, data);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removeSubscription(sub.endpoint);
      } else {
        console.error('Push notification error:', err.message);
      }
    }
  }));
}

module.exports = { saveSubscription, removeSubscription, notifyRoom };
