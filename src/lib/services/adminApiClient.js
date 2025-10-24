import { API_BASE_URL } from './api';

/**
 * Admin-specific API client that uses admin authentication tokens
 */
const adminApiClient = {
  /**
   * Get admin auth token from localStorage
   */
  getAdminToken() {
    return localStorage.getItem('admin_auth_token');
  },

  /**
   * Make HTTP request with admin authentication
   */
  async makeRequest(url, options = {}) {
    const token = this.getAdminToken();
    console.log('🔐 AdminApiClient: Token exists:', !!token);
    console.log('🔐 AdminApiClient: Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add admin auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ AdminApiClient: Authorization header added');
    } else {
      console.log('❌ AdminApiClient: No token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Admin API Error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          error: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Admin authentication required. Please log in again.');
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('✅ Admin API Success:', { url, data: responseData });
      return { success: true, data: responseData };

    } catch (error) {
      console.error('🚨 Admin API Request Error:', error);
      throw error;
    }
  },

  /**
   * GET request
   */
  get: async function(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post: async function(url, data, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  put: async function(url, data, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * PATCH request
   */
  patch: async function(url, data, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  delete: async function(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  },
};

export default adminApiClient;
