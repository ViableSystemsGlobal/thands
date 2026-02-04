import { useMemo } from "react";

export const useCartState = (cart) => {
  const cartTotal = useMemo(
    () => {
      const total = cart.reduce((total, item) => {
        // Safely get price and quantity, defaulting to 0 if invalid
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity, 10);
        
        // Only add if both are valid numbers
        if (!isNaN(price) && !isNaN(quantity)) {
          return total + (price * quantity);
        }
        
        console.warn('⚠️ Cart item has invalid price or quantity:', {
          itemId: item.id,
          price: item.price,
          quantity: item.quantity,
          parsedPrice: price,
          parsedQuantity: quantity
        });
        return total;
      }, 0);
      
      return total;
    },
    [cart]
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((total, item) => {
      const quantity = parseInt(item.quantity, 10);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0),
    [cart]
  );

  return {
    cartTotal,
    cartItemsCount,
  };
};
