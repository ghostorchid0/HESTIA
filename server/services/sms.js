async function sendSms(to, message) {
  if (!to) {
    console.log('[SMS] No recipient configured');
    return;
  }

  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'twilio') {
    try {
      const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to });
      console.log('[SMS] Twilio sent to', to);
      return;
    } catch (err) {
      console.error('[SMS] Twilio error:', err.message);
    }
  }

  if (provider === 'http') {
    try {
      const response = await fetch(process.env.SMS_HTTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: process.env.SMS_HTTP_KEY || '' },
        body: JSON.stringify({ to, message, sender: process.env.SMS_SENDER }),
      });
      console.log('[SMS] HTTP provider status:', response.status);
      return;
    } catch (err) {
      console.error('[SMS] HTTP provider error:', err.message);
    }
  }

  console.log('[SMS] Console provider:', { to, message });
}

module.exports = { sendSms };
