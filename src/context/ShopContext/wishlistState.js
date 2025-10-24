
import { useMemo, useCallback } from "react";

export const useWishlistState = (wishlist, wishlistActions) => {
  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const isItemInWishlist = useCallback(
    (productId) => {
      return wishlistActions.isInWishlist(productId, wishlist);
    },
    [wishlistActions, wishlist]
  );

  return {
    wishlistCount,
    isItemInWishlist,
  };
};
