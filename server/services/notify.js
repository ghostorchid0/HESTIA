const { sendEmail } = require('./email');
const { sendWhatsApp } = require('./whatsapp');

async function notifySubscriptionEvent(hotel, subject, message) {
  if (hotel.billingEmail) {
    await sendEmail(hotel.billingEmail, subject, message);
  }
  if (hotel.billingPhone) {
    await sendWhatsApp(hotel.billingPhone, message);
  }
}

module.exports = { notifySubscriptionEvent };
