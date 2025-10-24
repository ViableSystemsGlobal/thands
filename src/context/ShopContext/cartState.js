import { useMemo } from "react";

export const useCartState = (cart) => {
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  return {
    cartTotal,
    cartItemsCount,
  };
};
