const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class SasPayService {
  constructor() {
    this.apiKey = process.env.SASAPAY_API_KEY;
    this.baseUrl = 'https://api.saspay.me/api/v1';
  }

  /**
   * Get supported countries and networks
   */
  async getCountries() {
    try {
      const response = await axios.get(`${this.baseUrl}/countries/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('SasPay countries error:', error.response?.data || error.message);
      // Fallback to mock data for demo purposes
      return {
        success: true,
        data: [
          {
            code: 'BJ',
            name: 'Bénin',
            networks: [
              { code: 'mtn_bj', name: 'MTN Bénin' },
              { code: 'moov_bj', name: 'Moov Bénin' }
            ]
          },
          {
            code: 'CI',
            name: 'Côte d\'Ivoire',
            networks: [
              { code: 'orange_ci', name: 'Orange Côte d\'Ivoire' },
              { code: 'mtn_ci', name: 'MTN Côte d\'Ivoire' },
              { code: 'wave_ci', name: 'Wave Côte d\'Ivoire' }
            ]
          },
          {
            code: 'TG',
            name: 'Togo',
            networks: [
              { code: 'mtn_tg', name: 'MTN Togo' },
              { code: 'moov_tg', name: 'Moov Togo' }
            ]
          },
          {
            code: 'SN',
            name: 'Sénégal',
            networks: [
              { code: 'orange_sn', name: 'Orange Sénégal' },
              { code: 'wave_sn', name: 'Wave Sénégal' },
              { code: 'free_sn', name: 'Free Sénégal' }
            ]
          }
        ]
      };
    }
  }

  /**
   * Initiate softpay payment (direct mobile money push)
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount to pay
   * @param {string} paymentData.currency - Currency code (XOF, etc.)
   * @param {string} paymentData.country - Country code (BJ, CI, etc.)
   * @param {string} paymentData.network - Network code (mtn_bj, orange_ci, etc.)
   * @param {string} paymentData.description - Transaction description
   * @param {Object} paymentData.customer - Customer details
   * @param {string} paymentData.customer.phone - Customer phone number
   * @param {string} paymentData.customer.email - Customer email
   * @param {string} paymentData.customer.first_name - Customer first name
   * @param {string} paymentData.customer.last_name - Customer last name
   */
  async initiateSoftpayPayment(paymentData) {
    try {
      const idempotencyKey = uuidv4();
      
      const response = await axios.post(
        `${this.baseUrl}/payments/softpay/`,
        {
          amount: paymentData.amount.toString(),
          currency: paymentData.currency || 'XOF',
          country: paymentData.country || 'BJ',
          network: paymentData.network,
          description: paymentData.description || 'Abonnement Hestia',
          customer: {
            phone: paymentData.customer.phone,
            email: paymentData.customer.email,
            first_name: paymentData.customer.first_name,
            last_name: paymentData.customer.last_name
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      return {
        success: true,
        data: response.data,
        idempotencyKey
      };
    } catch (error) {
      console.error('SasPay softpay error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify payment status
   * @param {string} paymentId - Payment ID from SasPay
   */
  async verifyPayment(paymentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}/verify/`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('SasPay verify error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Retry failed payment
   * @param {string} paymentId - Payment ID to retry
   */
  async retryPayment(paymentId) {
    try {
      const idempotencyKey = uuidv4();
      
      const response = await axios.post(
        `${this.baseUrl}/payments/${paymentId}/retry/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      return {
        success: true,
        data: response.data,
        idempotencyKey
      };
    } catch (error) {
      console.error('SasPay retry error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new SasPayService();