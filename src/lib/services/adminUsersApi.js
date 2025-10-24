import adminApiClient from './adminApiClient';

// Admin Users API Service
export const adminUsersApi = {
  // Get all admin users
  async getUsers() {
    try {
      const response = await adminApiClient.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  },

  // Create new admin user
  async createUser(userData) {
    try {
      const response = await adminApiClient.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  },

  // Update admin user
  async updateUser(userId, userData) {
    try {
      const response = await adminApiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  },

  // Delete admin user
  async deleteUser(userId) {
    try {
      const response = await adminApiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting admin user:', error);
      throw error;
    }
  },

  // Get available roles and permissions
  async getRoles() {
    try {
      const response = await adminApiClient.get('/admin/users/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
};

export default adminUsersApi;
