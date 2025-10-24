import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/context/ShopContext';
import { useCurrency } from '@/context/CurrencyContext';
import { usePaymentFirst } from '../usePaymentFirst';

export const useCheckoutFormNew = () => {
  const { user } = useAuth();
  const { cart } = useShop();
  const { currency: displayCurrency } = useCurrency();
  // Simple shipping calculation (can be enhanced later)
  const calculateShippingCost = (subtotal, country) => {
    // Ghana domestic shipping
    if (country === 'Ghana') {
      return subtotal > 100 ? 0 : 15; // Free shipping over $100
    }
    // International shipping
    return subtotal > 200 ? 25 : 50; // Reduced international shipping over $200
  };
  const { loading: paymentLoading, processPaymentFirst } = usePaymentFirst();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Ghana',
    postalCode: '',
    orderNotes: '',
  });

  // Account creation state
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Loading state
  const [loading, setLoading] = useState(false);

  // Session ID for tracking
  const [sessionId] = useState(() => crypto.randomUUID());

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
      }));
    }
  }, [user]);

  // Calculate totals
  const baseSubtotal = cart.reduce((total, item) => {
    const itemPrice = item.is_gift_voucher && item.gift_voucher_types 
      ? item.gift_voucher_types.amount // Gift voucher amount should already be in dollars
      : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  const calculatedShippingCost = calculateShippingCost(baseSubtotal, formData.country);
  const couponDiscountAmount = appliedCoupon ? (appliedCoupon.discount_type === 'percentage' 
    ? (baseSubtotal * appliedCoupon.discount_value / 100)
    : appliedCoupon.discount_value) : 0;
  
  const totalAmount = Math.max(0, baseSubtotal + calculatedShippingCost - couponDiscountAmount);

  // Debug logging for calculations
  console.log('🧮 Checkout Calculations:', {
    cart: cart.map(item => ({ 
      name: item.name, 
      price: item.price, 
      quantity: item.quantity,
      is_gift_voucher: item.is_gift_voucher,
      gift_voucher_amount: item.gift_voucher_types?.amount
    })),
    baseSubtotal,
    calculatedShippingCost,
    couponDiscountAmount,
    totalAmount
  });

  // Validation functions
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim() ? '' : `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address';
      case 'phone':
        return value.trim() ? '' : 'Phone number is required';
      case 'address':
        return value.trim() ? '' : 'Address is required';
      case 'city':
        return value.trim() ? '' : 'City is required';
      case 'state':
        return value.trim() ? '' : 'State/Region is required';
      case 'country':
        return value.trim() ? '' : 'Country is required';
      case 'password':
        return createAccount && value.length < 6 ? 'Password must be at least 6 characters' : '';
      case 'confirmPassword':
        return createAccount && value !== password ? 'Passwords do not match' : '';
      default:
        return '';
    }
  }, [createAccount, password]);

  const validateForm = useCallback((formData, createAccount, password) => {
    const newErrors = {};
    
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'country'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Account creation validation
    if (createAccount) {
      const passwordError = validateField('password', password);
      if (passwordError) newErrors.password = passwordError;
      
      const confirmPasswordError = validateField('confirmPassword', confirmPassword);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, confirmPassword]);

  // Clear validation errors
  const clearValidationErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Handle form field changes
  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      return;
    }

    setLoading(true);

    try {
      await processPaymentFirst(
        formData,
        password,
        createAccount,
        cart,
        totalAmount,
        baseSubtotal,
        calculatedShippingCost,
        user,
        sessionId,
        appliedCoupon,
        couponDiscountAmount,
        validateForm,
        clearValidationErrors
      );
    } catch (error) {
      console.error('Checkout submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [
    cart,
    formData,
    password,
    createAccount,
    totalAmount,
    baseSubtotal,
    calculatedShippingCost,
    user,
    sessionId,
    appliedCoupon,
    couponDiscountAmount,
    validateForm,
    clearValidationErrors,
    processPaymentFirst
  ]);

  // Coupon handling functions
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    try {
      // Implementation for coupon application
      // This would typically call an API to validate and apply the coupon
      console.log('Applying coupon:', couponCode);
      // For now, we'll just show a placeholder
    } catch (error) {
      console.error('Error applying coupon:', error);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  }, []);

  return {
    // Form data
    formData,
    setFormData: handleInputChange,
    
    // Account creation
    createAccount,
    setCreateAccount,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    
    // Validation
    errors,
    touched,
    validateField,
    validateForm,
    clearValidationErrors,
    
    // Loading states
    loading: loading || paymentLoading,
    paymentLoading,
    
    // Shipping
    shippingRule: null,
    calculatedShippingCost,
    
    // Totals
    baseSubtotal,
    totalAmount,
    couponDiscountAmount,
    
    // Coupons
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscount,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    
    // Form submission
    handleSubmit,
    
    // Currency
    displayCurrency,
    
    // Cart
    cart,
  };
}; 