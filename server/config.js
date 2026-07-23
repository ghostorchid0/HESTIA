const crypto = require('crypto');
const webpush = require('web-push');

function getConfig() {
  const isProd = process.env.NODE_ENV === 'production';

  const required = ['PORT'];
  if (process.env.USE_MEMORY_DB !== 'true') {
    required.push('MONGO_URI');
  }
  if (isProd) {
    required.push('JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SUPERADMIN_USERNAME', 'SUPERADMIN_PASSWORD');
  }

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('JWT_SECRET not set. A random secret has been generated for this dev session.');
  } else if (isProd && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    const keys = webpush.generateVAPIDKeys();
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
    if (!isProd) {
      console.warn('VAPID keys not set. New VAPID keys have been generated for this dev session.');
      console.log('VAPID_PUBLIC_KEY=', vapidPublicKey);
    }
  }
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@hestia.local';

  const clientUrl = process.env.CLIENT_URL || (isProd ? null : '*');
  if (isProd && !clientUrl) {
    throw new Error('CLIENT_URL must be set in production');
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const superadminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

  if (isProd && (adminPassword === 'admin123' || superadminPassword === 'superadmin123')) {
    throw new Error('Default admin/superadmin passwords are not allowed in production');
  }

  return {
    port: parseInt(process.env.PORT, 10) || 5000,
    mongoUri: process.env.MONGO_URI,
    useMemoryDb: process.env.USE_MEMORY_DB === 'true',
    jwtSecret,
    clientUrl,
    adminUsername,
    adminPassword,
    superadminUsername,
    superadminPassword,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject,
  };
}

module.exports = getConfig();
