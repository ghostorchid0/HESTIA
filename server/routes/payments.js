const express = require('express');
const router = express.Router();
const sasaPay = require('../services/sasapay');
const Subscription = require('../models/Subscription');
const Hotel = require('../models/Hotel');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * POST /api/payments/initiate
 * Initiate a subscription payment via SasaPay
 */
router.post('/initiate', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { hotelId, amount, customerMobile, description } = req.body;

    // Validate required fields
    if (!hotelId || !amount || !customerMobile) {
      return res.status(400).json({ message: 'Missing required fields: hotelId, amount, customerMobile' });
    }

    // Find hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Generate unique transaction reference
    const transactionRef = `HESTIA-${hotelId}-${Date.now()}`;

    // Get callback URL from environment or use default
    const callbackUrl = process.env.CLIENT_URL 
      ? `${process.env.CLIENT_URL}/api/payments/webhook`
      : 'https://hestia-ix33.onrender.com/api/payments/webhook';

    // Initiate payment
    const result = await sasaPay.initiateC2BPayment({
      customerMobile,
      amount,
      transactionRef,
      description: description || `Hestia subscription for ${hotel.name}`,
      currency: 'KES',
      callbackUrl
    });

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to initiate payment', error: result.error });
    }

    // Create pending subscription record
    const subscription = await Subscription.create({
      hotel: hotelId,
      status: 'pending',
      amount,
      transactionRef,
      paymentMethod: 'sasapay',
      paymentData: result.data
    });

    res.json({
      success: true,
      transactionRef,
      message: 'Payment initiated successfully. Please complete payment on your phone.',
      subscriptionId: subscription._id
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

/**
 * POST /api/payments/webhook
 * SasaPay webhook endpoint for payment notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    const { transaction_ref, status, amount, customer_mobile } = req.body;

    console.log('SasaPay webhook received:', req.body);

    // Find subscription by transaction reference
    const subscription = await Subscription.findOne({ transactionRef: transaction_ref });
    if (!subscription) {
      console.log('Subscription not found for transaction:', transaction_ref);
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update subscription status based on payment status
    if (status === 'completed' || status === 'success') {
      subscription.status = 'active';
      subscription.paidAt = new Date();
      
      // Calculate subscription expiry (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      subscription.expiresAt = expiryDate;

      await subscription.save();

      // Update hotel subscription status
      await Hotel.findByIdAndUpdate(subscription.hotel, {
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiryDate
      });

      console.log('Subscription activated successfully:', subscription._id);
    } else if (status === 'failed' || status === 'cancelled') {
      subscription.status = 'failed';
      subscription.failedAt = new Date();
      await subscription.save();

      console.log('Subscription failed:', subscription._id);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
});

/**
 * GET /api/payments/status/:transactionRef
 * Check payment status
 */
router.get('/status/:transactionRef', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { transactionRef } = req.params;

    const result = await sasaPay.checkTransactionStatus(transactionRef);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to check payment status', error: result.error });
    }

    res.json(result.data);

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ message: 'Failed to check payment status' });
  }
});

/**
 * GET /api/payments/subscriptions
 * Get payment history for hotel
 */
router.get('/subscriptions', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    const subscriptions = await Subscription.find({ hotel: hotelId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(subscriptions);

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Failed to get subscriptions' });
  }
});

module.exports = router;