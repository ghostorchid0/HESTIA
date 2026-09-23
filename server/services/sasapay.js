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
      // Get countries
      const countriesResponse = await axios.get(`${this.baseUrl}/countries/`);
      const countries = countriesResponse.data.data || [];

      // Get networks
      const networksResponse = await axios.get(`${this.baseUrl}/networks/`);
      const networks = networksResponse.data.data?.results || [];

      // Create a map of country ID to networks
      const countryNetworksMap = {};
      networks.forEach(network => {
        const countryId = network.country;
        if (!countryNetworksMap[countryId]) {
          countryNetworksMap[countryId] = [];
        }
        countryNetworksMap[countryId].push({
          code: network.code,
          name: network.name
        });
      });

      // Merge countries with their networks
      const countriesWithNetworks = countries
        .filter(country => country.is_active) // Only active countries
        .map(country => ({
          code: country.iso_code,
          name: country.name,
          networks: countryNetworksMap[country.id] || []
        }))
        .filter(country => country.networks.length > 0); // Only countries with networks

      return {
        success: true,
        data: countriesWithNetworks
      };
    } catch (error) {
      console.error('SasPay countries error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
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