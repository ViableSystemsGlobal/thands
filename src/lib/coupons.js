import { api } from '@/lib/services/api';
import { TOAST_MESSAGES } from '@/lib/toast-messages';

export const validateCoupon = async (couponCode, cartTotal, toast, totalWithShipping = null) => {
  if (!couponCode || couponCode.trim() === "") {
    toast({
      title: "Invalid Code",
      description: "Please enter a coupon code or gift voucher code.",
      variant: "error",
    });
    return null;
  }

  try {
    // First, try to validate it as a coupon
    try {
      const couponResponse = await api.get(`/coupons/validate/${couponCode.trim()}`);
      const coupon = couponResponse.data || couponResponse;
      
      if (coupon) {
        // Backend already validated all rules, just check minimum purchase
        if (coupon.min_order_value && cartTotal < coupon.min_order_value) {
          toast({
            title: TOAST_MESSAGES.giftVoucher.applyError,
            description: `Minimum purchase of ${coupon.min_order_value} is required for this coupon.`,
            variant: "error",
          });
          return null;
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
          discountAmount = (cartTotal * coupon.discount_value) / 100;
          if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
            discountAmount = coupon.max_discount_amount;
          }
        } else if (coupon.discount_type === 'fixed_amount' || coupon.discount_type === 'fixed') {
          discountAmount = coupon.discount_value;
        } else if (coupon.discount_type === 'free_shipping') {
          discountAmount = 0; // Shipping discount handled separately
        }

        discountAmount = Math.min(discountAmount, cartTotal);

        return { ...coupon, type: 'coupon', calculated_discount: discountAmount };
      }
    } catch (couponError) {
      // Coupon not found, try gift voucher
      console.log('Not a coupon, trying gift voucher...');
    }

    // If not found as coupon, try to validate it as a gift voucher
    try {
      const voucherResponse = await api.get(`/gift-vouchers/validate/${couponCode.trim()}`);
      const giftVoucher = voucherResponse.data || voucherResponse;

      if (giftVoucher) {
        // Check if voucher is active and not expired (backend should also validate this)
        if (giftVoucher.is_redeemed) {
          toast({
            title: TOAST_MESSAGES.giftVoucher.applyError,
            description: "This gift voucher has already been fully redeemed.",
            variant: "error",
          });
          return null;
        }

        // Check expiry date
        if (giftVoucher.expiry_date && new Date(giftVoucher.expiry_date) < new Date()) {
          toast({
            title: TOAST_MESSAGES.giftVoucher.applyError,
            description: "This gift voucher has expired.",
            variant: "error",
          });
          return null;
        }

        // Get the voucher amount from the type
        const voucherAmount = giftVoucher.gift_voucher_types?.amount || giftVoucher.amount || 0;
        
        if (voucherAmount <= 0) {
          toast({
            title: TOAST_MESSAGES.giftVoucher.applyError,
            description: "This gift voucher has no remaining balance.",
            variant: "error",
          });
          return null;
        }

        // For gift vouchers, use total with shipping if available, otherwise use cart total
        const orderTotal = totalWithShipping !== null ? totalWithShipping : cartTotal;
        
        // Calculate discount amount (gift voucher discount is the voucher amount or order total, whichever is smaller)
        const discountAmount = Math.min(voucherAmount, orderTotal);

        return { 
          ...giftVoucher, 
          type: 'gift_voucher',
          discount_type: 'fixed',
          discount_value: discountAmount,
          calculated_discount: discountAmount,
          remaining_balance: voucherAmount,
          code: giftVoucher.voucher_code || giftVoucher.code
        };
      }
    } catch (voucherError) {
      // Gift voucher not found either
      console.log('Not a gift voucher either');
    }

    // Neither coupon nor gift voucher found
    toast({
      title: TOAST_MESSAGES.giftVoucher.applyError,
      description: "The code you entered is invalid or does not exist.",
      variant: "error",
    });
    return null;

  } catch (err) {
    console.error("Error validating coupon/gift voucher:", err);
    toast({
      title: TOAST_MESSAGES.general.unexpected,
      description: "Could not validate code. Please try again.",
      variant: "error",
    });
    return null;
  }
};
