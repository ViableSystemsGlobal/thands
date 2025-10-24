
import React, { createContext, useContext, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCartActions } from "./ShopContext/cartActions";
import { useWishlistActions } from "./ShopContext/wishlistActions";
import { useShopData } from "./ShopContext/useShopData";
import { useCartState } from "./ShopContext/cartState";
import { useWishlistState } from "./ShopContext/wishlistState";
import { useSearchState } from "./ShopContext/searchState";
import { generateSessionId } from "./ShopContext/utils";
import { useToast } from "@/components/ui/use-toast";

const ShopContext = createContext(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ShopProvider is now only used for customer pages, so always use customer context
  const contextType = 'customer';
  
  // Add a unique provider instance ID to track if provider is being recreated
  const [providerId] = useState(() => {
    const id = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🛒 ShopProvider (${contextType}): Created new provider instance:`, id);
    return id;
  });
  
  const [sessionId, setSessionId] = useState(() => {
    const id = generateSessionId(contextType);
    console.log(`🛒 ShopProvider (${contextType}): Generated sessionId:`, id, 'for provider:', providerId);
    return id;
  });
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const {
    cart,
    setCart,
    wishlist,
    setWishlist,
    loadingCart,
    loadingWishlist,
    error,
    loadCartData,
    loadWishlistData,
  } = useShopData(sessionId);

  const cartActions = useCartActions(sessionId, user, setCart, setUpdatingItems, loadCartData, toast);
  const wishlistActionsHook = useWishlistActions(sessionId, user, setWishlist, loadWishlistData, toast);
  
  const { cartTotal, cartItemsCount } = useCartState(cart);
  const { wishlistCount, isItemInWishlist } = useWishlistState(wishlist, wishlistActionsHook);
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } = useSearchState();

  const value = {
    cart,
    wishlist,
    ...cartActions,
    toggleWishlist: wishlistActionsHook.toggleWishlist,
    isInWishlist: isItemInWishlist,
    cartTotal,
    cartItemsCount,
    wishlistCount,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    loading: loadingCart || loadingWishlist, 
    error,
    updatingItems,
    sessionId,
    setCart, 
    setWishlist,
    loadCartData,
    loadWishlistData,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};
