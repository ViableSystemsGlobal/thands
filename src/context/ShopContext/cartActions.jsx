
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { cartApi, transformCartResponse } from "@/lib/services/cartApi";
import { getCustomerDetailsFromDB } from "./utils"; 
import React, { useCallback } from "react";
import { useCurrency } from "@/context/CurrencyContext";

export const useCartActions = (
  sessionId, 
  user, 
  setCart, 
  setUpdatingItems, 
  loadCartDataCallback,
  toast 
) => {
  const { formatPrice } = useCurrency();

  const addToCart = useCallback(async (product, selectedSize, isGiftVoucher = false) => {
    console.log('🛒 addToCart called with:', { product, selectedSize, isGiftVoucher });
    const itemIdentifier = isGiftVoucher ? `gv-${product.id}` : `${product.id}-${selectedSize?.size || 'default'}`;
    try {
      setUpdatingItems(prev => new Set(prev).add(itemIdentifier));
      const { userId, customerId } = await getCustomerDetailsFromDB(user?.id);
      
      let result;
      if (isGiftVoucher) {
        result = await cartApi.addGiftVoucherToCart(sessionId, product.id, 1, userId);
      } else {
        result = await cartApi.addCartItem(sessionId, product.id, 1, selectedSize?.size, userId);
      }

      if (result) {
        const transformedItem = transformCartResponse([result])[0];
        console.log('🛒 Transformed item from API:', transformedItem);
        setCart(prevCart => {
          console.log('🛒 Previous cart state before update:', prevCart);
          // Check if item already exists and update it, otherwise add new
          const existingIndex = prevCart.findIndex(ci => 
            ci.products?.id === product.id && ci.size === (selectedSize?.size || null)
          );
          console.log('🛒 Existing item index:', existingIndex);
          
          if (existingIndex >= 0) {
            // Update existing item
            console.log('🛒 Updating existing item at index:', existingIndex);
            const updatedCart = [...prevCart];
            updatedCart[existingIndex] = transformedItem;
            console.log('🛒 Updated cart state:', updatedCart);
            return updatedCart;
          } else {
            // Add new item
            console.log('🛒 Adding new item to cart');
            const newCart = [transformedItem, ...prevCart];
            console.log('🛒 New cart state:', newCart);
            return newCart;
          }
        });

        const itemName = isGiftVoucher ? "Gift Voucher" : product.name;
        const itemPriceInUSD = isGiftVoucher ? result.gift_voucher_amount : product.price;
        
        const descriptionParts = [
          `Item: ${itemName}`,
          selectedSize && !isGiftVoucher ? `Size: ${selectedSize.size}` : null,
          `Price: ${formatPrice(itemPriceInUSD, true)}`, 
          `Quantity: ${result.quantity}`,
        ].filter(Boolean).join("\n");

        toast({
          title: TOAST_MESSAGES.cart.add.success,
          description: (
            <div className="whitespace-pre-line">{descriptionParts}</div>
          ),
          variant: "success", 
        });

      } else {
         throw new Error("No item returned from cart API");
      }
    } catch (error) {
      console.error("Error adding to cart in cartActions:", error);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.add.error + (error.message ? `: ${error.message}` : ''),
        variant: "error", 
      });
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemIdentifier);
        return newSet;
      });
    }
  }, [sessionId, user, setCart, setUpdatingItems, toast, formatPrice]);

  const updateCartQuantity = useCallback(async (itemId, newQuantity) => {
    console.log('🛒 updateCartQuantity called for itemId:', itemId, 'newQuantity:', newQuantity);
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      
      const response = await cartApi.updateCartItemQuantity(itemId, newQuantity);
      
      if (response && response.success && response.data) {
        const transformedItem = transformCartResponse([response.data])[0];
        console.log('🛒 Transformed item from API after quantity update:', transformedItem);
        setCart(prevCart => {
          console.log('🛒 Previous cart state before quantity update:', prevCart);
          const updatedCart = prevCart.map(item =>
              item.id === itemId
                  ? transformedItem
                  : item
          );
          console.log('🛒 Updated cart state after quantity update:', updatedCart);
          return updatedCart;
        });

        toast({
          title: TOAST_MESSAGES.success.title,
          description: TOAST_MESSAGES.cart.update.success,
          variant: "success",
        });
      } else {
        throw new Error("No item returned from updateCartItemQuantityInDb");
      }
    } catch (error) {
      console.error("Error updating quantity in cartActions:", error);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.update.error + (error.message ? `: ${error.message}` : ''),
        variant: "error",
      });
      if (loadCartDataCallback) await loadCartDataCallback();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [setCart, setUpdatingItems, loadCartDataCallback, toast]);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await cartApi.removeCartItem(itemId);
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
      
      toast({
        title: TOAST_MESSAGES.success.title,
        description: TOAST_MESSAGES.cart.remove.success,
        variant: "success",
      });
    } catch (error) {
      console.error("Error removing item in cartActions:", error);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.remove.error + (error.message ? `: ${error.message}` : ''),
        variant: "error",
      });
      if (loadCartDataCallback) await loadCartDataCallback();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [setCart, setUpdatingItems, loadCartDataCallback, toast]);

  const clearCart = useCallback(async () => {
    try {
      setUpdatingItems(prev => new Set(prev).add('clearing-cart')); 
      await cartApi.clearCart(sessionId, user?.id);
      setCart([]); 
      toast({
        title: TOAST_MESSAGES.success.title,
        description: TOAST_MESSAGES.cart.clear.success,
        variant: "success",
      });
    } catch (error) {
      console.error("Error clearing cart in cartActions:", error);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.clear.error + (error.message ? `: ${error.message}` : ''),
        variant: "error",
      });
       if (loadCartDataCallback) await loadCartDataCallback(); 
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete('clearing-cart');
        return newSet;
      });
    }
  }, [sessionId, setCart, setUpdatingItems, loadCartDataCallback, toast]);
  

  const fetchCart = useCallback(async () => {
    try {
      console.log('🛒 Fetching cart for session:', sessionId, 'user:', user?.id);
      const cartData = await cartApi.fetchCartItems(sessionId, user?.id);
      console.log('🛒 Raw cart data:', cartData);
      const transformedCartData = transformCartResponse(cartData || []);
      console.log('🛒 Transformed cart data:', transformedCartData);
      setCart(transformedCartData);
      return transformedCartData;
    } catch (err) {
      console.error("Error fetching cart in cartActions:", err);
      toast({
        title: TOAST_MESSAGES.error.title,
        description: TOAST_MESSAGES.cart.loadError,
        variant: "error",
      });
      return [];
    }
  }, [sessionId, setCart, toast]);


  return { addToCart, updateCartQuantity, removeFromCart, clearCart, fetchCart };
};
