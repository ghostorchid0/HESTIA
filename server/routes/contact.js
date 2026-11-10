const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../services/email');
const config = require('../config');

/**
 * POST /api/contact
 * Send contact form submission
 */
router.post('/',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(), // Simplified - accept any phone format
  body('message').notEmpty().withMessage('Message is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, phone, message } = req.body;

      // Send email notification to superadmin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@hestia.local';
      const subject = `Nouveau message de contact - ${name}`;
      const text = `
Nouveau message de contact reçu :

Nom: ${name}
Email: ${email}
Téléphone: ${phone || 'Non fourni'}

Message:
${message}

Date: ${new Date().toLocaleString('fr-FR')}
      `;

      const emailSent = await sendEmail(adminEmail, subject, text);
      
      if (emailSent) {
        console.log('Contact form email sent to', adminEmail);
      } else {
        console.log('Contact form email not sent (SMTP not configured or failed)');
      }

      // Also log to console for debugging
      console.log('Contact form submission:', {
        name,
        email,
        phone,
        message,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
);

module.exports = router;
