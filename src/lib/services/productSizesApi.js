// Product Sizes API service - replaces Supabase product_sizes queries
import adminApiClient from '@/lib/services/adminApiClient';
import { api } from '@/lib/services/api';

export const productSizesApi = {
  // Fetch product sizes by product ID (Public endpoint - no auth required)
  async fetchProductSizes(productId) {
    // Use regular api client since this is a public endpoint
    const data = await api.get(`/product-sizes/product/${productId}`);
    return data || [];
  },

  // Create product sizes (Admin only)
  async createProductSizes(productId, sizes) {
    const response = await adminApiClient.post('/product-sizes', {
      product_id: productId,
      sizes: sizes
    });
    return response.data || response;
  },

  // Update product size (Admin only)
  async updateProductSize(sizeId, sizeData) {
    const response = await adminApiClient.patch(`/product-sizes/${sizeId}`, sizeData);
    return response.data || response;
  },

  // Delete product size (Admin only)
  async deleteProductSize(sizeId) {
    const response = await adminApiClient.delete(`/product-sizes/${sizeId}`);
    return response.data || response;
  }
};

// Helper function to transform API response to match Supabase format
export const transformProductSizesResponse = (apiResponse) => {
  return apiResponse;
};
