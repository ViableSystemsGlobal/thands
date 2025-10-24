// Orders API service for creating and managing orders
import { api } from './api';

export const ordersApi = {
  // Create a new order (public endpoint)
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  },

  // Get order by ID (requires authentication)
  async getOrder(orderId, token = null) {
    try {
      const response = await api.get(`/orders/${orderId}`, {}, token);
      return response;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  },

  // Get user's orders (requires authentication)
  async getUserOrders(token = null) {
    try {
      const response = await api.get('/orders/user', {}, token);
      return response;
    } catch (error) {
      console.error('User orders fetch error:', error);
      throw error;
    }
  },

  // Get order by order number (public endpoint)
  async getOrderByNumber(orderNumber) {
    try {
      const response = await api.get(`/orders/by-number/${orderNumber}`);
      return response;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  }
};

export default ordersApi;
