const axios = require('axios');
const config = require('../config');

function isConfigured() {
  return !!config.chariow.apiKey;
}

function getHeaders() {
  return { Authorization: `Bearer ${config.chariow.apiKey}` };
}

async function validateLicense(licenseKey) {
  if (!licenseKey) throw new Error('License key required');

  if (!isConfigured()) {
    return {
      valid: true,
      key: licenseKey,
      status: 'active',
      isActive: true,
      isExpired: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      productId: 'SIMULATED',
      productName: 'Hestia License',
      customerEmail: null,
    };
  }

  const res = await axios.get(`${config.chariow.baseUrl}/licenses/${encodeURIComponent(licenseKey)}`, { headers: getHeaders() });
  const data = res.data?.data || res.data;
  if (!data) throw new Error('Invalid response from Chariow');

  const isActive = data.is_active === true;
  const isExpired = data.is_expired === true;
  const expiresAt = data.expires_at || null;

  return {
    valid: isActive && !isExpired,
    key: data.license?.key || data.key || licenseKey,
    status: data.status,
    isActive,
    isExpired,
    expiresAt,
    productId: data.product?.id || data.product_id,
    productName: data.product?.name,
    customerEmail: data.customer?.email,
    raw: data,
  };
}

function verifyWebhookSignature(payload, signature) {
  if (!config.chariow.webhookSecret) return true;
  if (!signature) return false;
  // Chariow webhook signature verification may use HMAC; implement if documented.
  // For now, compare a simple secret token header fallback can be used in the route.
  return true;
}

module.exports = { isConfigured, validateLicense, verifyWebhookSignature };
