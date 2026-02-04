// Cart API service - replaces Supabase cart queries
import { api } from '@/lib/services/api';

export const cartApi = {
  // Fetch cart items
  async fetchCartItems(sessionId, userId = null) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/cart?${queryString}` : '/cart';
    
    return await api.get(endpoint);
  },

  // Add item to cart
  async addCartItem(sessionId, productId, quantity = 1, size = null, userId = null) {
    return await api.post('/cart', {
      session_id: sessionId,
      product_id: productId,
      quantity: quantity,
      size: size,
      user_id: userId
    });
  },

  // Add gift voucher to cart
  async addGiftVoucherToCart(sessionId, giftVoucherTypeId, quantity = 1, userId = null) {
    return await api.post('/cart', {
      session_id: sessionId,
      gift_voucher_type_id: giftVoucherTypeId,
      quantity: quantity,
      user_id: userId
    });
  },

  // Update cart item quantity
  async updateCartItemQuantity(itemId, quantity) {
    return await api.patch(`/cart/${itemId}/quantity`, { quantity });
  },

  // Remove item from cart
  async removeCartItem(itemId) {
    return await api.delete(`/cart/${itemId}`);
  },

  // Clear entire cart
  async clearCart(sessionId, userId = null) {
    return await api.delete('/cart', {
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Helper function to transform API response to match Supabase format
export const transformCartResponse = (apiResponse) => {
  if (Array.isArray(apiResponse)) {
    return apiResponse.map(item => {
      // Safely parse price - ensure we get a valid number or 0
      const parsePrice = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Calculate the price at top level - use adjusted price if available
      const productPrice = parsePrice(item.adjusted_product_price) || parsePrice(item.product_price);
      const voucherAmount = parsePrice(item.gift_voucher_amount);
      
      const transformed = {
        ...item,
        // Add price at top level for CartItem component - use adjusted price if available
        price: item.product_id ? productPrice : voucherAmount,
        products: item.product_id ? {
          id: item.product_id,
          name: item.product_name,
          description: item.product_description,
          image_url: item.product_image_url,
          price: productPrice,
          category: item.product_category
        } : null,
        gift_voucher_types: item.gift_voucher_type_id ? {
          id: item.gift_voucher_type_id,
          name: item.gift_voucher_name,
          amount: voucherAmount,
          description: item.gift_voucher_description,
          image_url: item.gift_voucher_image_url
        } : null
      };

      // Remove the individual product fields since they're now nested
      delete transformed.product_id;
      delete transformed.product_name;
      delete transformed.product_description;
      delete transformed.product_image_url;
      delete transformed.product_price;
      delete transformed.product_category;
      delete transformed.gift_voucher_type_id;
      delete transformed.gift_voucher_name;
      delete transformed.gift_voucher_amount;
      delete transformed.gift_voucher_description;
      delete transformed.gift_voucher_image_url;

      return transformed;
    });
  }
  return apiResponse;
};
