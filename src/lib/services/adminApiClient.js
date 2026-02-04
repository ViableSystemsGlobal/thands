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
   * Get admin branch filter from localStorage
   */
  getAdminBranchFilter() {
    if (typeof window !== 'undefined') {
      const branch = localStorage.getItem('admin_selected_branch');
      // Return null for "ALL", otherwise return the branch code
      return branch === 'ALL' ? null : branch;
    }
    return null;
  },

  /**
   * Make HTTP request with admin authentication
   */
  async makeRequest(url, options = {}) {
    const token = this.getAdminToken();
    const branchFilter = this.getAdminBranchFilter();
    
    console.log('🔐 AdminApiClient: Making request to:', url);
    console.log('🔐 AdminApiClient: Token exists:', !!token);
    console.log('🔐 AdminApiClient: Branch filter:', branchFilter || 'ALL');
    
    if (!token) {
      console.error('❌ AdminApiClient: No admin token found!');
      throw new Error('Admin authentication required. Please log in again.');
    }
    
    const config = {
      ...options,
    };

    // Set up headers
    config.headers = {
      ...(options.headers || {}),
    };

    // Add admin auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ AdminApiClient: Authorization header added');
    } else {
      console.log('❌ AdminApiClient: No token available');
    }

    // Add branch filter to headers if provided
    if (branchFilter) {
      config.headers['X-Admin-Branch-Filter'] = branchFilter;
      console.log('✅ AdminApiClient: Branch filter header added:', branchFilter);
    } else {
      console.log('✅ AdminApiClient: No branch filter (viewing all branches)');
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
      console.log('✅ Admin API Success:', { url, status: response.status });
      console.log('📊 Admin API Response data:', responseData);
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
    const isFormData = data instanceof FormData;
    
    // For FormData, don't set any headers and let the browser handle it
    if (isFormData) {
      return this.makeRequest(url, {
        ...options,
        method: 'POST',
        body: data,
        // Don't set Content-Type for FormData - let browser set it with boundary
      });
    }
    
    // For regular JSON data
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
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
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
