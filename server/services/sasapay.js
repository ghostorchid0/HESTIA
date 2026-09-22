const axios = require('axios');

class SasaPayService {
  constructor() {
    this.clientId = process.env.SASAPAY_CLIENT_ID;
    this.clientSecret = process.env.SASAPAY_CLIENT_SECRET;
    this.merchantCode = process.env.SASAPAY_MERCHANT_CODE;
    this.environment = process.env.SASAPAY_ENVIRONMENT || 'sandbox';
    
    // API endpoints based on environment
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.sasapay.app/api/v1'
      : 'https://sandbox.skoinapp.net/api/v1';
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth2 access token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/token/`, {
        username: this.clientId,
        password: this.clientSecret,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour (3600 seconds), subtract 60 seconds buffer
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('SasaPay authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with SasaPay');
    }
  }

  /**
   * Initiate C2B payment (Customer to Business)
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.customerMobile - Customer's mobile number
   * @param {number} paymentData.amount - Amount to pay
   * @param {string} paymentData.transactionRef - Unique transaction reference
   * @param {string} paymentData.description - Transaction description
   * @param {string} paymentData.callbackUrl - Webhook URL for payment notification
   */
  async initiateC2BPayment(paymentData) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/payments/request-payment/`,
        {
          bill_number: this.merchantCode,
          customer_mobile: paymentData.customerMobile,
          transaction_ref: paymentData.transactionRef,
          transaction_description: paymentData.description,
          currency: paymentData.currency || 'KES',
          amount: paymentData.amount,
          callback_url: paymentData.callbackUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('SasaPay C2B payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Check transaction status
   * @param {string} transactionRef - Transaction reference
   */
  async checkTransactionStatus(transactionRef) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/payments/status/${transactionRef}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('SasaPay transaction status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify webhook signature (if signature verification is supported)
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    // SasaPay webhook signature verification implementation
    // This depends on their specific signature algorithm
    // For now, we'll return true as we implement later
    return true;
  }
}

module.exports = new SasaPayService();