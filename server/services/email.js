const nodemailer = require('nodemailer');
const config = require('../config');

function createTransporter(smtp) {
  if (!smtp.host || !smtp.user) {
    return null;
  }
  return nodemailer.createTransporter({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

const primary = createTransporter(config.smtp);
const fallback = createTransporter(config.smtpFallback);

async function sendEmail(to, subject, text, attachments = null) {
  if (!to) {
    console.log('[EMAIL] No recipient configured');
    return;
  }

  const smtpConfigs = [
    { transporter: primary, smtp: config.smtp },
    { transporter: fallback, smtp: config.smtpFallback },
  ].filter(entry => entry.transporter);

  if (smtpConfigs.length === 0) {
    console.log('[EMAIL] No SMTP configured, logging to console');
    console.log('[EMAIL]', { to, subject, text, attachments: attachments?.map(a => a.filename) });
    return;
  }

  let lastError = null;
  for (const { transporter, smtp } of smtpConfigs) {
    try {
      await transporter.sendMail({ from: smtp.from, to, subject, text, attachments });
      console.log('[EMAIL] Sent to', to, 'via', smtp.host);
      return;
    } catch (err) {
      lastError = err;
      console.error(`[EMAIL] Failed via ${smtp.host}:`, err.message);
    }
  }
  throw lastError || new Error('All SMTP providers failed');
}

module.exports = { sendEmail };
