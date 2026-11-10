const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * POST /api/contact
 * Send contact form submission
 */
router.post('/',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('message').notEmpty().withMessage('Message is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, phone, message } = req.body;

      // For now, just log the contact message
      // In production, you would send this via email or store in database
      console.log('Contact form submission:', {
        name,
        email,
        phone,
        message,
        timestamp: new Date().toISOString()
      });

      // TODO: Send email notification to admin
      // TODO: Store in database for tracking

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
