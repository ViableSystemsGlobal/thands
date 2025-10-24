
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { wishlistApi, transformWishlistResponse } from "@/lib/services/wishlistApi";
import { getCustomerDetailsFromDB } from "./utils";
import React, { useCallback } from "react";

export const useWishlistActions = (
  sessionId, 
  user, 
  setWishlist, 
  loadWishlistDataCallback,
  toast
) => {

  const isInWishlist = useCallback((productId, currentWishlist) => {
    return currentWishlist ? currentWishlist.some(item => item.product_id === productId) : false;
  }, []);


  const toggleWishlist = useCallback(async (product) => {
    try {
      const { userId, customerId } = await getCustomerDetailsFromDB(user?.id);
      
      const currentWishlist = await wishlistApi.fetchWishlistItems(sessionId, userId);
      const existingItem = currentWishlist.find(item => item.product_id === product.id);

      if (existingItem) {
        await wishlistApi.removeWishlistItem(existingItem.id);
        setWishlist(prev => prev.filter(item => item.product_id !== product.id));
        toast({
          title: TOAST_MESSAGES.success.title || "Success",
          description: TOAST_MESSAGES.wishlist.remove.success,
          variant: "success",
        });
      } else {
        const newItem = await wishlistApi.addWishlistItem(sessionId, product.id, userId, customerId);
        if (newItem) {
            setWishlist(prev => [...prev, transformWishlistResponse([newItem])[0]]);
             toast({
              title: TOAST_MESSAGES.success.title || "Success",
              description: TOAST_MESSAGES.wishlist.add.success,
              variant: "success",
            });
        } else {
           throw new Error("Failed to add item to wishlist, no item returned.");
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist in wishlistActions:", error);
      const errorMessage = TOAST_MESSAGES.wishlist.toggleError || "Could not update wishlist.";
      toast({
        title: TOAST_MESSAGES.error.title || "Error",
        description: errorMessage + (error.message ? `: ${error.message}` : ''),
        variant: "error",
      });
      if (loadWishlistDataCallback) await loadWishlistDataCallback();
    }
  }, [sessionId, user, setWishlist, loadWishlistDataCallback, toast]);


  const fetchWishlist = useCallback(async () => {
    try {
      const wishlistData = await wishlistApi.fetchWishlistItems(sessionId, user?.id);
      setWishlist(wishlistData || []);
      return wishlistData;
    } catch (err) {
      console.error("Error fetching wishlist in wishlistActions:", err);
      toast({
        title: TOAST_MESSAGES.error.title || "Error",
        description: TOAST_MESSAGES.wishlist.loadError || "Failed to load wishlist.",
        variant: "error",
      });
      return [];
    }
  }, [sessionId, user, setWishlist, toast]);

  return { toggleWishlist, fetchWishlist, isInWishlist };
};
