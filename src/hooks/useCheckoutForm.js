import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/context/ShopContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useFormInitialization } from "./useCheckoutForm/initialization";
import { useFormManagement } from "./useCheckoutForm/formManagement";
import { useCouponManagement } from "./useCheckoutForm/couponManagement";
import { usePaymentFirst } from "./usePaymentFirst";
import { INITIAL_CHECKOUT_FORM_DATA } from "./useCheckoutForm/constants";
import { api } from "@/lib/api"; 
import React from 'react';

export const useCheckoutForm = () => {
  const { user } = useAuth();
  const { cart, cartTotal, sessionId: shopSessionId } = useShop(); 
  const { displayCurrency, exchangeRate } = useCurrency();

  // State declarations first
  const [formData, setFormData] = useState(INITIAL_CHECKOUT_FORM_DATA);
  const [password, setPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [authCustomer, setAuthCustomer] = useState(null);
  const [overallLoading, setOverallLoading] = useState(true);

  // Debug cart and loading states
  useEffect(() => {
    console.log('🛒 useCheckoutForm states:', {
      cartLength: cart.length,
      cartTotal,
      user: !!user,
      authCustomer: !!authCustomer,
      initializationComplete,
      formData: formData.firstName ? 'has data' : 'empty'
    });
  }, [cart.length, cartTotal, user, authCustomer, initializationComplete, formData]);

  const fetchAuthCustomer = useCallback(async () => {
    if (user?.id) {
      try {
        const data = await api.get('/auth/profile');
        setAuthCustomer(data);
      } catch (e) {
        console.error("Exception fetching authenticated customer:", e);
        setAuthCustomer(null);
      }
    } else {
      setAuthCustomer(null);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  useEffect(() => {
    fetchAuthCustomer();
  }, [fetchAuthCustomer]);

  const { 
    shippingRules, 
    previousAddresses,
    initialLoading: formInitializationLoading,
  } = useFormInitialization(
    cart,
    user,
    authCustomer,
    setFormData,
    setOverallLoading,
    setInitializationComplete,
    fetchAuthCustomer 
  );

  const {
    formErrors, 
    shippingRule,
    calculatedShippingCost,
    handleInputChange,
    setSelectedAddress,
    validateForm,
    clearValidationErrors,
  } = useFormManagement(
    formData,
    setFormData,
    INITIAL_CHECKOUT_FORM_DATA, 
    password, 
    createAccount, 
    cartTotal, 
    shippingRules, 
    authCustomer
  );

  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscount,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
  } = useCouponManagement(cartTotal, exchangeRate, calculatedShippingCost);

  const {
    loading: paymentLoading,
    processPaymentFirst,
  } = usePaymentFirst();

  const baseSubtotal = cartTotal;
  const shippingCost = calculatedShippingCost || 0;
  const totalBeforeDiscount = baseSubtotal + shippingCost;
  const totalAmount = totalBeforeDiscount - couponDiscount;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    await processPaymentFirst(
      formData,
      password,
      createAccount,
      cart,
      totalAmount,
      baseSubtotal,
      shippingCost,
      user,
      shopSessionId,
      appliedCoupon,
      couponDiscount,
      validateForm,
      clearValidationErrors
    );
  };

  // overallLoading is now managed by state above

  // Update overall loading when payment loading changes
  useEffect(() => {
    if (paymentLoading) {
      setOverallLoading(true);
    }
  }, [paymentLoading]);

  // Debug loading states
  useEffect(() => {
    console.log('🔄 useCheckoutForm loading states:', {
      formInitializationLoading,
      paymentLoading,
      overallLoading,
      initializationComplete,
      user: !!user,
      authCustomer: !!authCustomer,
      cartLength: cart.length
    });
  }, [formInitializationLoading, paymentLoading, overallLoading, initializationComplete, user, authCustomer, cart.length]);

  return {
    formData,
    setFormData,
    password,
    setPassword,
    createAccount,
    setCreateAccount,
    formErrors,
    shippingRule,
    calculatedShippingCost,
    shippingRules,
    previousAddresses,
    handleInputChange,
    setSelectedAddress,
    handleSubmit,
    loading: overallLoading,
    initializationComplete,
    displayCurrency,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscount,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    validateForm,
  };
};
