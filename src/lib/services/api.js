/**
 * Main API client for making HTTP requests to the backend
 */

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api'  // Update this for production
  : 'http://localhost:3003/api';

/**
 * Default fetch options
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Get branch code from localStorage or window
 */
const getBranchCode = () => {
  if (typeof window !== 'undefined') {
    return window.__branchCode || localStorage.getItem('branch_code') || 'GH';
  }
  return 'GH';
};

/**
 * Make HTTP request with error handling
 */
const makeRequest = async (url, options = {}, customToken = null) => {
  const token = customToken || getAuthToken();
  
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Add auth token if available
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add branch code header
  const branchCode = getBranchCode();
  if (branchCode) {
    config.headers['X-Branch-Code'] = branchCode;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * API client object with common HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get: async (url, options = {}, customToken = null) => {
    return makeRequest(url, { ...options, method: 'GET' }, customToken);
  },

  /**
   * POST request
   */
  post: async (url, data, options = {}, customToken = null) => {
    return makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }, customToken);
  },

  /**
   * PUT request
   */
  put: async (url, data, options = {}, customToken = null) => {
    return makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }, customToken);
  },

  /**
   * PATCH request
   */
  patch: async (url, data, options = {}, customToken = null) => {
    return makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }, customToken);
  },

  /**
   * DELETE request
   */
  delete: async (url, options = {}, customToken = null) => {
    return makeRequest(url, { ...options, method: 'DELETE' }, customToken);
  },
};

export default api;
