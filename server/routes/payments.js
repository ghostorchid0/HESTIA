const express = require('express');
const router = express.Router();
const sasPay = require('../services/sasapay');
const Payment = require('../models/Payment');
const Hotel = require('../models/Hotel');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/payments/countries
 * Get supported countries and networks
 */
router.get('/countries', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const result = await sasPay.getCountries();
    
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to get countries', error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ message: 'Failed to get countries' });
  }
});

/**
 * POST /api/payments/initiate
 * Initiate a subscription payment via SasPay
 */
router.post('/initiate', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { hotelId, amount, phone, email, firstName, lastName, country, network, description } = req.body;

    // Validate required fields
    if (!hotelId || !amount || !phone || !country || !network) {
      return res.status(400).json({ 
        message: 'Missing required fields: hotelId, amount, phone, country, network' 
      });
    }

    // Find hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Initiate payment
    const result = await sasPay.initiateSoftpayPayment({
      amount,
      currency: 'XOF',
      country,
      network,
      description: description || `Abonnement Hestia - ${hotel.name}`,
      customer: {
        phone,
        email: email || `hotel${hotelId}@hestia.local`,
        first_name: firstName || hotel.name.split(' ')[0] || 'Hotel',
        last_name: lastName || hotel.name.split(' ').slice(1).join(' ') || 'Admin'
      }
    });

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to initiate payment', error: result.error });
    }

    // Create pending payment record
    const payment = await Payment.create({
      hotelId,
      amount,
      currency: 'XOF',
      status: 'pending',
      provider: 'sasapay',
      operator: network,
      msisdn: phone,
      transref: result.data.id,
      sasapayResponse: result.data,
      type: 'renewal'
    });

    res.json({
      success: true,
      paymentId: result.data.id,
      status: result.data.status,
      checkoutUrl: result.data.checkout_url,
      message: result.data.message || 'Payment initiated successfully',
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

/**
 * GET /api/payments/verify/:paymentId
 * Verify payment status
 */
router.get('/verify/:paymentId', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await sasPay.verifyPayment(paymentId);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to verify payment', error: result.error });
    }

    // Update payment if successful
    if (result.data.status === 'SUCCESS') {
      const payment = await Payment.findOne({ transref: paymentId });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.paidAt = new Date();
        
        // Calculate subscription expiry (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await payment.save();

        // Update hotel subscription status
        await Hotel.findByIdAndUpdate(payment.hotelId, {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiryDate
        });
      }
    }

    res.json(result.data);

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
});

/**
 * POST /api/payments/retry/:paymentId
 * Retry failed payment
 */
router.post('/retry/:paymentId', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await sasPay.retryPayment(paymentId);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to retry payment', error: result.error });
    }

    res.json(result.data);

  } catch (error) {
    console.error('Payment retry error:', error);
    res.status(500).json({ message: 'Failed to retry payment' });
  }
});

/**
 * GET /api/payments/subscriptions
 * Get payment history for hotel
 */
router.get('/subscriptions', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    const payments = await Payment.find({ hotelId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(payments);

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
});

module.exports = router;