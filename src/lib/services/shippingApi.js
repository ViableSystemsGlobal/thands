import { api } from './api';

/**
 * Get shipping rates for an order
 * @param {Object} orderData - Order data with items and shipping address
 * @returns {Promise<Object>} Shipping rates response
 */
export const getShippingRates = async (orderData) => {
  try {
    const response = await api.post('/shipping/rates', orderData);
    return response.data;
  } catch (error) {
    console.error('Error getting shipping rates:', error);
    throw error;
  }
};

/**
 * Create shipping label
 * @param {string} orderId - Order ID
 * @param {string} rateId - Selected rate ID
 * @returns {Promise<Object>} Label creation response
 */
export const createShippingLabel = async (orderId, rateId) => {
  try {
    const response = await api.post('/shipping/label', {
      orderId,
      rateId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating shipping label:', error);
    throw error;
  }
};

/**
 * Track shipment
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<Object>} Tracking response
 */
export const trackShipment = async (trackingNumber) => {
  try {
    const response = await api.get(`/shipping/track/${trackingNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error tracking shipment:', error);
    throw error;
  }
};

/**
 * Get supported carriers for a country
 * @param {string} countryCode - Country code
 * @returns {Promise<Object>} Carriers response
 */
export const getSupportedCarriers = async (countryCode) => {
  try {
    const response = await api.get(`/shipping/carriers/${countryCode}`);
    return response.data;
  } catch (error) {
    console.error('Error getting carriers:', error);
    throw error;
  }
};

/**
 * Validate shipping address
 * @param {Object} address - Address to validate
 * @returns {Promise<Object>} Validation response
 */
export const validateShippingAddress = async (address) => {
  try {
    const response = await api.post('/shipping/validate-address', { address });
    return response.data;
  } catch (error) {
    console.error('Error validating address:', error);
    throw error;
  }
};
