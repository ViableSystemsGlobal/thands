
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { cartApi, transformCartResponse } from "@/lib/services/cartApi";
import { wishlistApi, transformWishlistResponse } from "@/lib/services/wishlistApi";

export const useShopData = (sessionId) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [error, setError] = useState(null);

  const loadCartData = useCallback(async () => {
    console.log('🛒 loadCartData called with sessionId:', sessionId, 'user:', user?.id);
    if (!sessionId) {
      console.log('🛒 No sessionId, skipping cart load');
      return;
    }
    try {
      setLoadingCart(true);
      setError(null);
      console.log('🛒 Fetching cart items from API...');
      const cartData = await cartApi.fetchCartItems(sessionId, user?.id);
      console.log('🛒 Raw cart data from API:', cartData);
      const transformedCartData = transformCartResponse(cartData || []);
      console.log('🛒 Transformed cart data:', transformedCartData);
      setCart(transformedCartData);
    } catch (err) {
      console.error("Error loading cart in useShopData:", err);
      setError("Failed to load cart");
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.loadError,
        variant: "error",
      });
    } finally {
      setLoadingCart(false);
    }
  }, [sessionId, user?.id, toast, setCart, setLoadingCart, setError]);

  const loadWishlistData = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoadingWishlist(true);
      const wishlistData = await wishlistApi.fetchWishlistItems(sessionId, user?.id);
      const transformedData = transformWishlistResponse(wishlistData);
      setWishlist(transformedData || []);
    } catch (err) {
      console.error("Error loading wishlist in useShopData:", err);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.wishlist.loadError,
        variant: "error",
      });
    } finally {
      setLoadingWishlist(false);
    }
  }, [sessionId, user?.id, toast, setWishlist, setLoadingWishlist]);
  
  useEffect(() => {
    if (sessionId) {
      loadCartData();
      loadWishlistData();
    }
  }, [sessionId, user?.id]);

  return {
    cart,
    setCart,
    wishlist,
    setWishlist,
    loadingCart,
    loadingWishlist,
    error,
    loadCartData,
    loadWishlistData,
  };
};
