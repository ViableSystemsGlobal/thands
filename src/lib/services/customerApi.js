import { api } from './api';

/**
 * Customer API service for managing customer data
 */
export const customerApi = {
  /**
   * Get or create a customer record
   * @param {Object} customerData - Customer information
   * @param {boolean} attemptAccountCreation - Whether to attempt account creation
   * @returns {Promise<Object>} Customer record
   */
  async getOrCreateCustomer(customerData, attemptAccountCreation = false) {
    try {
      const response = await api.post('/customers/get-or-create', {
        ...customerData,
        attemptAccountCreation
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get or create customer');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getOrCreateCustomer:', error);
      throw error;
    }
  },

  /**
   * Create a new guest customer record
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Customer record
   */
  async createGuestCustomer(customerData) {
    try {
      const response = await api.post('/customers/guest', customerData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create guest customer');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating guest customer:', error);
      throw error;
    }
  },

  /**
   * Update customer details
   * @param {string} customerId - Customer ID
   * @param {Object} customerData - Updated customer information
   * @returns {Promise<Object>} Updated customer record
   */
  async updateCustomerDetails(customerId, customerData) {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update customer details');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating customer details:', error);
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer record
   */
  async getCustomer(customerId) {
    try {
      const response = await api.get(`/customers/${customerId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get customer');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  },

  /**
   * Search for customer by email
   * @param {string} email - Customer email
   * @returns {Promise<Object|null>} Customer record or null
   */
  async findCustomerByEmail(email) {
    try {
      const response = await api.get(`/customers/search?email=${encodeURIComponent(email)}`);
      
      if (!response.success) {
        if (response.error === 'Customer not found') {
          return null;
        }
        throw new Error(response.error || 'Failed to search for customer');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error searching for customer:', error);
      throw error;
    }
  }
};

export default customerApi;
