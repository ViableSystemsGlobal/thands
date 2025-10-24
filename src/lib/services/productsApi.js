// Products API service - replaces Supabase products queries
import { api } from '@/lib/services/api';

export const productsApi = {
  // Fetch all products with optional filtering
  async fetchProducts(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return await api.get(endpoint);
  },

  // Fetch single product by ID
  async fetchProductById(id) {
    return await api.get(`/products/${id}`);
  },

  // Fetch categories
  async fetchCategories() {
    return await api.get('/products/categories/list');
  },

  // Create product (admin only)
  async createProduct(productData) {
    return await api.post('/products', productData);
  },

  // Update product (admin only)
  async updateProduct(id, productData) {
    return await api.put(`/products/${id}`, productData);
  },

  // Delete product (admin only)
  async deleteProduct(id) {
    return await api.delete(`/products/${id}`);
  },

  // Fetch featured products (we'll implement this filter in the backend)
  async fetchFeaturedProducts() {
    // For now, we'll fetch all products and filter on frontend
    // Later we can add a 'featured' filter to the backend
    const response = await this.fetchProducts({ limit: 10 });
    return {
      ...response,
      products: response.products.filter(product => product.is_featured)
    };
  }
};

// Helper function to transform API response to match Supabase format
export const transformProductsResponse = (apiResponse) => {
  return {
    data: apiResponse.products || [],
    count: apiResponse.pagination?.total || 0,
    error: null
  };
};

// Helper function to transform single product response
export const transformProductResponse = (apiResponse) => {
  return {
    data: apiResponse,
    error: null
  };
};
