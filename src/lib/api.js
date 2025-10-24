// API Client for the new backend (replaces Supabase client)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('🌐 API Client: Making request to:', url);
      console.log('🔐 API Client: Auth header:', config.headers.Authorization ? 'Present' : 'Missing');
      console.log('🔐 API Client: Token value:', config.headers.Authorization);
      
      const response = await fetch(url, config);
      console.log('📡 API Client: Response status:', response.status);
      console.log('📡 API Client: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ API Client: Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Client: Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ API Client: Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // File upload
  async upload(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      method: 'POST',
      body: formData,
    };

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

// Create and export the API client instance
export const api = new ApiClient();

// Export individual methods for convenience
export const { get, post, put, delete: del, upload } = api;
