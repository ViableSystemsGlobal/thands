// Product Sizes API service - replaces Supabase product_sizes queries
import adminApiClient from '@/lib/services/adminApiClient';

export const productSizesApi = {
  // Fetch product sizes by product ID
  async fetchProductSizes(productId) {
    const response = await adminApiClient.get(`/product-sizes/product/${productId}`);
    // adminApiClient returns { success: true, data: [...] }, so we need response.data
    return response.data || response;
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
