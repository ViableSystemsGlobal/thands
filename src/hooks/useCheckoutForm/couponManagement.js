import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { validateCoupon } from '@/lib/coupons';
import { TOAST_MESSAGES } from '@/lib/toast-messages';
import React from 'react';

export const useCouponManagement = (cartTotal, exchangeRate, shippingCost = 0) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid Coupon",
        description: "Please enter a coupon code.",
        variant: "error",
      });
      return;
    }
    setCouponLoading(true);
    try {
      // Calculate total with shipping for gift vouchers
      const totalWithShipping = cartTotal + shippingCost;
      
      const validatedCoupon = await validateCoupon(couponCode, cartTotal, toast, totalWithShipping);
      if (validatedCoupon) {
        setAppliedCoupon(validatedCoupon);
        setCouponDiscount(validatedCoupon.calculated_discount);
        toast({
          title: TOAST_MESSAGES.giftVoucher.applySuccess, 
          description: `${validatedCoupon.type === 'gift_voucher' ? 'Gift voucher' : 'Coupon'} "${validatedCoupon.code}" applied successfully.`,
          variant: "success",
        });
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast({
        title: TOAST_MESSAGES.general.unexpected,
        description: "Failed to apply coupon. Please try again.",
        variant: "error",
      });
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, cartTotal, shippingCost, toast]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
      variant: "info",
    });
  }, [toast]);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscount,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
  };
};
