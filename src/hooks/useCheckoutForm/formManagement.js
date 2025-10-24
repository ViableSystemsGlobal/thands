import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { calculateShipping } from "@/lib/shipping";
import { INITIAL_CHECKOUT_FORM_DATA } from "./constants"; // Import constant
import React from 'react';


export const useFormManagement = (
  formData, 
  setFormData, 
  initialCheckoutFormDataProp, // Renamed to avoid conflict, though INITIAL_CHECKOUT_FORM_DATA is now imported
  initialPassword, 
  initialCreateAccount, 
  cartTotal, 
  shippingRulesProp, 
  authCustomer
) => {
  const [password, setPassword] = useState(initialPassword);
  const [createAccount, setCreateAccount] = useState(initialCreateAccount);
  const [formErrors, setFormErrors] = useState({});
  const [shippingRule, setShippingRule] = useState(null);
  const [calculatedShippingCost, setCalculatedShippingCost] = useState(0);
  const lastCalculationRef = useRef({ country: '', cartTotal: 0, rulesLength: 0 });
  
  // Memoize the shipping rules to prevent unnecessary re-renders
  const stableShippingRules = useMemo(() => shippingRulesProp, [shippingRulesProp.length]);
  
  // Create a stable flag for shipping rules availability
  const hasShippingRules = useMemo(() => shippingRulesProp.length > 0, [shippingRulesProp.length]);

  useEffect(() => {
    // Only run if we have the minimum required data
    if (!formData.country || cartTotal <= 0 || !hasShippingRules) {
      console.log('❌ Shipping calculation skipped - missing requirements');
      setShippingRule(null);
      setCalculatedShippingCost(0);
      return;
    }

    const currentState = {
      country: formData.country,
      cartTotal,
      rulesLength: stableShippingRules.length
    };

    // Check if we've already calculated for this exact state
    const lastState = lastCalculationRef.current;
    if (lastState.country === currentState.country && 
        lastState.cartTotal === currentState.cartTotal && 
        lastState.rulesLength === currentState.rulesLength) {
      console.log('🔄 formManagement useEffect - skipping duplicate calculation');
      return;
    }

    console.log('🔄 formManagement useEffect triggered:', {
      country: formData.country,
      cartTotal,
      shippingRulesLength: stableShippingRules.length,
      hasCountry: !!formData.country,
      hasCartTotal: cartTotal > 0,
      hasShippingRules: hasShippingRules
    });

    updateShippingRuleLocal();

    // Update the last calculation state
    lastCalculationRef.current = currentState;
  }, [formData.country, cartTotal, hasShippingRules]);


  const updateShippingRuleLocal = async () => {
    console.log('🚚 updateShippingRuleLocal called with:', {
      country: formData.country,
      cartTotal,
      shippingRulesLength: stableShippingRules.length
    });

    if (!formData.country || stableShippingRules.length === 0) {
      console.log('❌ Early return - missing country or shipping rules');
      setCalculatedShippingCost(0);
      return;
    }

    try {
      const rule = await calculateShipping(formData.country, cartTotal);
      console.log('📦 Shipping rule result:', rule);
      
      setShippingRule(rule);
      const shippingCost = rule ? rule.shipping_cost : 0;
      console.log('💰 Setting shipping cost to:', shippingCost);
      setCalculatedShippingCost(shippingCost);
    } catch (error) {
      console.error('❌ Error in updateShippingRuleLocal:', error);
      setShippingRule(null);
      setCalculatedShippingCost(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('📝 Form input changed:', { name, value });
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const setSelectedAddress = useCallback((addressData) => {
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        firstName: addressData.firstName || authCustomer?.first_name || "",
        lastName: addressData.lastName || authCustomer?.last_name || "",
        email: addressData.email || authCustomer?.email || "",
        phone: addressData.phone || authCustomer?.phone || "",
        address: addressData.address || "",
        city: addressData.city || "",
        state: addressData.state || "",
        country: addressData.country || "",
        postalCode: addressData.postalCode || "",
      }));
    } else {
      // Reset to initial or user's base info, but keep order notes
      setFormData(prev => ({
        ...INITIAL_CHECKOUT_FORM_DATA, // Use imported constant
        firstName: authCustomer?.first_name || "",
        lastName: authCustomer?.last_name || "",
        email: authCustomer?.email || "",
        phone: authCustomer?.phone || "",
        orderNotes: prev.orderNotes, 
      }));
    }
  }, [authCustomer, setFormData]);

  const validateForm = (currentFormData, currentCreateAccount, currentPassword) => {
    const errors = {};
    if (!currentFormData.firstName) errors.firstName = "First name is required";
    if (!currentFormData.lastName) errors.lastName = "Last name is required";
    if (!currentFormData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(currentFormData.email)) errors.email = "Email is invalid";
    if (!currentFormData.phone) errors.phone = "Phone is required";
    if (!currentFormData.address) errors.address = "Address is required";
    if (!currentFormData.city) errors.city = "City is required";
    if (!currentFormData.state) errors.state = "State/Region is required";
    if (!currentFormData.country) errors.country = "Country is required";
    if (!currentFormData.postalCode) errors.postalCode = "Postal code is required";

    if (!shippingRule && currentFormData.country && shippingRulesProp.length > 0) {
      errors.country = "Shipping not available for this country or cart value.";
    } else if (!currentFormData.country && shippingRulesProp.length > 0 && cartTotal > 0) { // only require country if cart has items
      errors.country = "Please select a country for shipping calculation.";
    }

    if (currentCreateAccount && !authCustomer && (!currentPassword || currentPassword.length < 6)) {
      errors.password = "Password must be at least 6 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const clearValidationErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  return {
    password, setPassword,
    createAccount, setCreateAccount,
    formErrors, 
    shippingRule,
    calculatedShippingCost,
    handleInputChange,
    setSelectedAddress,
    validateForm,
    clearValidationErrors
  };
};
