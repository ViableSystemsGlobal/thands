import { api } from '@/lib/services/api';

// Auth API service for handling authentication with the new backend
export const authApi = {
  // Register a new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getProfile(customToken = null) {
    try {
      const response = await api.get('/auth/profile', false, customToken);
      return response;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(profileData, customToken = null) {
    try {
      const response = await api.put('/auth/profile', profileData, false, customToken);
      return response;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Admin login (uses same endpoint but stores admin token)
  async adminLogin(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Verify token
  async verifyToken(customToken = null) {
    try {
      const response = await api.get('/auth/verify', {}, customToken);
      return response;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  },

  // Logout (client-side only - just remove token)
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Get stored token
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Store authentication data
  setAuthData(user, token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get stored user data
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authApi;
