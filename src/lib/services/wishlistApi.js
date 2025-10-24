// Wishlist API service - replaces Supabase wishlist queries
import { api } from '@/lib/services/api';

export const wishlistApi = {
  // Fetch wishlist items
  async fetchWishlistItems(sessionId, userId = null) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/wishlist?${queryString}` : '/wishlist';
    
    return await api.get(endpoint);
  },

  // Add item to wishlist
  async addWishlistItem(sessionId, productId, userId = null, customerId = null) {
    return await api.post('/wishlist', {
      session_id: sessionId,
      product_id: productId,
      user_id: userId,
      customer_id: customerId
    });
  },

  // Remove item from wishlist
  async removeWishlistItem(itemId) {
    return await api.delete(`/wishlist/${itemId}`);
  },

  // Clear entire wishlist
  async clearWishlist(sessionId, userId = null) {
    return await api.delete('/wishlist', {
      session_id: sessionId,
      user_id: userId
    });
  },

  // Check if item is in wishlist
  async checkWishlistItem(productId, sessionId, userId = null) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId);
    
    const queryString = params.toString();
    const endpoint = `/wishlist/check/${productId}${queryString ? `?${queryString}` : ''}`;
    
    return await api.get(endpoint);
  }
};

// Helper function to transform API response to match Supabase format
export const transformWishlistResponse = (apiResponse) => {
  if (Array.isArray(apiResponse)) {
    return apiResponse.map(item => ({
      ...item,
      products: {
        id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        image_url: item.product_image_url,
        price: item.product_price,
        category: item.product_category
      }
    }));
  }
  return apiResponse;
};
