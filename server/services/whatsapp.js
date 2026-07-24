async function sendWhatsApp(to, message) {
  if (!to) {
    console.log('[WHATSAPP] No recipient configured');
    return;
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_FROM;
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;

  if (sid && token && from && from.startsWith('whatsapp:')) {
    try {
      const client = require('twilio')(sid, token);
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      await client.messages.create({ body: message, from, to: whatsappTo });
      console.log('[WHATSAPP] Sent to', whatsappTo);
      return;
    } catch (err) {
      console.error('[WHATSAPP] Twilio error:', err.message);
    }
  }

  console.log('[WHATSAPP] Console provider:', { to, message });
}

module.exports = { sendWhatsApp };
