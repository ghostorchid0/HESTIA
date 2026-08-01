const nodemailer = require('nodemailer');
const config = require('../config');

function createTransporter(smtp) {
  if (!smtp.host || !smtp.user) {
    return null;
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  transporter.on('error', (err) => {
    console.error('[EMAIL] Transporter error:', err.message);
  });
  return transporter;
}

const primary = createTransporter(config.smtp);
const fallback = createTransporter(config.smtpFallback);

async function sendEmail(to, subject, text, attachments = null) {
  if (!to) {
    console.log('[EMAIL] No recipient configured');
    return false;
  }

  const smtpConfigs = [
    { transporter: primary, smtp: config.smtp },
    { transporter: fallback, smtp: config.smtpFallback },
  ].filter((entry) => entry.transporter);

  if (smtpConfigs.length === 0) {
    console.log('[EMAIL] No SMTP configured, logging to console');
    console.log('[EMAIL]', { to, subject, text, attachments: attachments?.map((a) => a.filename) });
    return false;
  }

  for (const { transporter, smtp } of smtpConfigs) {
    try {
      await transporter.sendMail({ from: smtp.from, to, subject, text, attachments });
      console.log('[EMAIL] Sent to', to, 'via', smtp.host);
      return true;
    } catch (err) {
      console.error(`[EMAIL] Failed via ${smtp.host}:`, err.message);
    }
  }
  return false;
}

module.exports = { sendEmail };
