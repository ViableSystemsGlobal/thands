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
  authCustomer,
  cartItems = [], // Cart items for weight calculation
  selectedShippingOption = null // DHL/international shipping selection
) => {
  const [password, setPassword] = useState(initialPassword);
  const [createAccount, setCreateAccount] = useState(initialCreateAccount);
  const [formErrors, setFormErrors] = useState({});
  const [shippingRule, setShippingRule] = useState(null);
  const [calculatedShippingCost, setCalculatedShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [hasAttemptedShippingCalculation, setHasAttemptedShippingCalculation] = useState(false);
  const lastCalculationRef = useRef({ country: '', cartTotal: 0, rulesLength: 0 });
  
  // Memoize the shipping rules to prevent unnecessary re-renders
  const stableShippingRules = useMemo(() => shippingRulesProp, [shippingRulesProp.length]);
  
  // Create a stable flag for shipping rules availability
  const hasShippingRules = useMemo(() => shippingRulesProp.length > 0, [shippingRulesProp.length]);
  
  // Calculate total weight from cart items
  const totalWeight = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => {
      // Each product has weight (default 1kg if not set)
      const itemWeight = item.products?.weight ? parseFloat(item.products.weight) : 1;
      return sum + (itemWeight * (item.quantity || 1));
    }, 0);
  }, [cartItems]);

  // Define updateShippingRuleLocal BEFORE the useEffect hooks that use it
  const updateShippingRuleLocal = useCallback(async () => {
    console.log('🚚 updateShippingRuleLocal called with:', {
      country: formData.country,
      cartTotal,
      shippingRulesLength: stableShippingRules.length,
      rules: stableShippingRules.map(r => ({ name: r.name, country: r.country }))
    });

    if (!formData.country || stableShippingRules.length === 0) {
      console.log('❌ Early return - missing country or shipping rules', {
        hasCountry: !!formData.country,
        country: formData.country,
        rulesLength: stableShippingRules.length
      });
      setCalculatedShippingCost(0);
      setHasAttemptedShippingCalculation(false);
      setIsCalculatingShipping(false);
      setShippingRule(null);
      return;
    }

    setIsCalculatingShipping(true);
    setHasAttemptedShippingCalculation(true);

    try {
      // Use the already-loaded shipping rules instead of making a new API call
      const normalizedCountry = formData.country?.trim();
      console.log('🔍 Looking for shipping rule for country:', normalizedCountry);
      
      // Find matching rule from already-loaded rules
      const countryRules = stableShippingRules.filter(rule => {
        const ruleCountry = rule.country ? rule.country.trim() : null;
        const matchesCountry = ruleCountry && (
          ruleCountry.toLowerCase() === normalizedCountry?.toLowerCase() ||
          ruleCountry.toLowerCase() === formData.country?.toLowerCase()
        );
        
        const matchesAmount = (!rule.min_order_value || cartTotal >= rule.min_order_value) &&
                             (!rule.max_order_value || cartTotal <= rule.max_order_value);
        
        console.log('🔍 Checking rule:', {
          name: rule.name,
          ruleCountry,
          normalizedCountry,
          matchesCountry,
          minOrder: rule.min_order_value,
          maxOrder: rule.max_order_value,
          cartTotal,
          matchesAmount
        });
        
        return matchesCountry && matchesAmount;
      });

      let rule = null;
      if (countryRules.length > 0) {
        rule = countryRules[0];
        console.log('✅ Found country-specific rule:', rule);
      } else {
        console.log('⚠️ No country-specific rule found, trying international rules');
        // Try international rules (no country set)
        const internationalRules = stableShippingRules.filter(rule => {
          const hasNoCountry = !rule.country || rule.country.trim() === '' || rule.country.toLowerCase() === 'international';
          const matchesAmount = (!rule.min_order_value || cartTotal >= rule.min_order_value) &&
                               (!rule.max_order_value || cartTotal <= rule.max_order_value);
          return hasNoCountry && matchesAmount;
        });
        
        if (internationalRules.length > 0) {
          rule = internationalRules[0];
          console.log('✅ Found international rule:', rule);
        } else {
          console.log('❌ No matching shipping rule found');
          console.log('📋 Available rules:', stableShippingRules.map(r => ({
            name: r.name,
            country: r.country,
            min: r.min_order_value,
            max: r.max_order_value
          })));
        }
      }
      
      console.log('📦 Shipping rule result:', rule);
      
      setShippingRule(rule);
      
      // Calculate weight-based shipping cost
      // If per_kg_rate is set, use per_kg_rate * totalWeight
      // Otherwise fall back to flat shipping_cost
      let shippingCost = 0;
      if (rule) {
        const perKgRate = parseFloat(rule.per_kg_rate) || 0;
        const flatRate = parseFloat(rule.shipping_cost) || 0;
        
        if (perKgRate > 0 && totalWeight > 0) {
          // Weight-based calculation
          shippingCost = perKgRate * totalWeight;
          console.log('⚖️ Weight-based shipping:', { perKgRate, totalWeight, shippingCost });
        } else {
          // Fall back to flat rate
          shippingCost = flatRate;
          console.log('📦 Flat rate shipping:', { flatRate, shippingCost });
        }
      }
      
      console.log('💰 Setting shipping cost to:', shippingCost, 'Type:', typeof shippingCost, 'Weight:', totalWeight, 'kg');
      setCalculatedShippingCost(shippingCost);
    } catch (error) {
      console.error('❌ Error in updateShippingRuleLocal:', error);
      setShippingRule(null);
      setCalculatedShippingCost(0);
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [formData.country, cartTotal, stableShippingRules, totalWeight]);

  // Force recalculation when shipping rules are first loaded and country is already set
  useEffect(() => {
    // If we have a country, cart total, and shipping rules just became available, force recalculation
    if (formData.country && cartTotal > 0 && hasShippingRules && stableShippingRules.length > 0) {
      // Reset the last calculation state to force a new calculation
      const currentState = {
        country: formData.country,
        cartTotal,
        rulesLength: stableShippingRules.length
      };
      const lastState = lastCalculationRef.current;
      
      // Only trigger if this is a new state (rules just loaded or state changed)
      if (lastState.rulesLength === 0 || 
          lastState.country !== currentState.country || 
          lastState.cartTotal !== currentState.cartTotal ||
          lastState.rulesLength !== currentState.rulesLength) {
        console.log('🔄 Shipping rules available, calculating shipping for country:', formData.country);
        // Reset last calculation to force update
        lastCalculationRef.current = { country: '', cartTotal: 0, rulesLength: 0 };
        updateShippingRuleLocal();
      }
    }
  }, [hasShippingRules, formData.country, cartTotal, stableShippingRules.length, updateShippingRuleLocal]);

  useEffect(() => {
    // Only run if we have the minimum required data
    if (!formData.country || cartTotal <= 0 || !hasShippingRules) {
      console.log('❌ Shipping calculation skipped - missing requirements:', {
        hasCountry: !!formData.country,
        cartTotal,
        hasShippingRules
      });
      // Only reset if we truly don't have requirements
      if (!formData.country || cartTotal <= 0) {
        setShippingRule(null);
        setCalculatedShippingCost(0);
      }
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
  }, [formData.country, cartTotal, hasShippingRules, stableShippingRules, updateShippingRuleLocal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // When address autocomplete fires, reset shipping dedup so it recalculates
    if (name === '_addressAutoComplete') {
      lastCalculationRef.current = { country: '', cartTotal: 0, rulesLength: 0 };
      updateShippingRuleLocal();
      return;
    }

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
    const noPostalCountries = ['ghana', 'nigeria', 'togo', 'benin', 'côte d\'ivoire', 'ivory coast', 'burkina faso', 'mali', 'niger'];
    if (!currentFormData.postalCode && !noPostalCountries.includes(currentFormData.country?.toLowerCase())) {
      errors.postalCode = "Postal code is required";
    }

    // Only show shipping error if:
    // 1. We have a country selected
    // 2. We have shipping rules available
    // 3. We've attempted to calculate shipping (not just waiting for async)
    // 4. The calculation completed and no rule was found
    // 5. No DHL/international shipping option was selected
    const hasValidShipping = shippingRule || selectedShippingOption;
    if (!hasValidShipping && 
        currentFormData.country && 
        shippingRulesProp.length > 0 && 
        hasAttemptedShippingCalculation && 
        !isCalculatingShipping) {
      errors.country = "Shipping not available for this country or cart value.";
    } else if (!currentFormData.country && shippingRulesProp.length > 0 && cartTotal > 0 && !selectedShippingOption) { // only require country if cart has items and no shipping selected
      errors.country = "Please select a country for shipping calculation.";
    }

    if (!currentFormData.measurementsConfirmed) {
      errors.measurementsConfirmed = "Please confirm you have reviewed the measurements guide.";
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
    totalWeight,
    handleInputChange,
    setSelectedAddress,
    validateForm,
    clearValidationErrors
  };
};
