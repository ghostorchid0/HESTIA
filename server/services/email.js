const nodemailer = require('nodemailer');
const config = require('../config');

const smtp = config.smtp;

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!smtp.host || !smtp.user) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return transporter;
}

async function sendEmail(to, subject, text) {
  if (!to) {
    console.log('[EMAIL] No recipient configured');
    return;
  }
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL]', { to, subject, text });
    return;
  }
  try {
    await t.sendMail({ from: smtp.from, to, subject, text });
    console.log('[EMAIL] Sent to', to);
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err.message);
  }
}

module.exports = { sendEmail };
