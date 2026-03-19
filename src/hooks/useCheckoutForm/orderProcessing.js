import { useShop } from "@/context/ShopContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { customerApi } from "@/lib/services/customerApi";
import { useNavigate } from "react-router-dom";
import React from "react";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { createPaymentRecord } from "@/lib/services/payment";
import { sendPaymentSuccess, sendOrderConfirmation } from '@/lib/services/notifications';

export const useOrderProcessing = (
  formData,
  password,
  createAccount,
  cart,
  totalAmount,
  baseSubtotal,
  shippingCost,
  user,
  setLoading,
  clearValidationErrors,
  validateForm,
  sessionId,
  appliedCoupon,
  couponDiscountAmount
) => {
  const { clearCart } = useShop();
  const { currency: displayCurrency, exchangeRate, getPaymentAmountAndCurrency } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const createOrderAfterPayment = async (paymentDetails, customerRecord, userIdToUse, customerIdToUse) => {
    try {
      const generatedOrderNumber = `TH-${Date.now()}`;
      const paymentDetailsGHS = getPaymentAmountAndCurrency(totalAmount);

      const orderPayload = {
        session_id: sessionId,
        user_id: userIdToUse,
        customer_id: customerIdToUse,
        status: "confirmed",
        total_amount: parseFloat(totalAmount.toFixed(2)),
        currency: "USD",
        payment_status: "paid",
        order_number: generatedOrderNumber,
        base_subtotal: parseFloat(baseSubtotal.toFixed(2)),
        base_shipping: parseFloat(shippingCost.toFixed(2)),
        base_total: parseFloat((baseSubtotal + shippingCost).toFixed(2)),
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_country: formData.country,
        shipping_postal_code: formData.postalCode,
        shipping_phone: formData.phone,
        shipping_email: formData.email,
        notes: formData.orderNotes,
        customer_photo_url: formData.customerPhotoUrl || null,
        payment_reference: paymentDetails.reference,
        payment_gateway: 'paystack',
        payment_completed_at: new Date().toISOString(),
        items: cart.map(item => ({
          product_id: item.product_id || item.products?.id || null,
          gift_voucher_type_id: item.gift_voucher_type_id || null,
          quantity: item.quantity,
          price: item.is_gift_voucher && item.gift_voucher_types ? item.gift_voucher_types.amount : item.price,
          size: item.size || null,
        })),
      };

      if (appliedCoupon) {
        orderPayload.coupon_id = appliedCoupon.id;
      }
      if (couponDiscountAmount) {
        orderPayload.coupon_discount_amount = parseFloat(couponDiscountAmount.toFixed(2));
      }

      const orderResponse = await api.post('/orders', orderPayload);
      const order = orderResponse.order || orderResponse;

      if (!order || !order.id || !order.order_number) {
        throw new Error("Order creation failed or did not return expected data.");
      }

      // Update payment log with correct order number
      await createPaymentRecord({
        orderNumber: order.order_number,
        reference: paymentDetails.reference,
        amount: paymentDetails.amount,
        currency: 'GHS',
        status: 'success',
        gatewayResponse: paymentDetails.verificationData
      });

      // Handle gift voucher redemption if a gift voucher was applied
      if (appliedCoupon && appliedCoupon.type === 'gift_voucher') {
        try {
          console.log('Redeeming gift voucher:', appliedCoupon.code);

          const redemptionAmountCents = Math.round(appliedCoupon.calculated_discount * 100);

          const { redeemGiftVoucher } = await import('@/lib/db/issuedGiftVouchers');

          await redeemGiftVoucher(appliedCoupon.id, redemptionAmountCents);

          console.log('Gift voucher redeemed successfully:', {
            voucherId: appliedCoupon.id,
            code: appliedCoupon.code,
            redemptionAmount: appliedCoupon.calculated_discount,
            orderNumber: order.order_number
          });
        } catch (voucherError) {
          console.error('Error redeeming gift voucher:', voucherError);
          toast({
            title: "Gift Voucher Issue",
            description: "Order completed but there was an issue redeeming your gift voucher. Please contact support.",
            variant: "warning",
          });
        }
      }

      // Send payment success notifications
      try {
        console.log('Sending payment success notifications for order:', order.order_number);
        const orderDataForNotification = orderResponse.order || orderResponse;
        if (orderDataForNotification) {
          await sendPaymentSuccess(orderDataForNotification, paymentDetails);
          console.log('Payment success notifications sent successfully');
        }
      } catch (notificationError) {
        console.error('Error sending payment success notifications:', notificationError);
      }

      // Send order confirmation notifications
      try {
        console.log('Sending order confirmation notifications for order:', order.order_number);
        const orderDataForNotification = orderResponse.order || orderResponse;
        if (orderDataForNotification) {
          await sendOrderConfirmation(orderDataForNotification);
          console.log('Order confirmation notifications sent successfully');
        }
      } catch (notificationError) {
        console.error('Error sending order confirmation notifications:', notificationError);
      }

      // Clear cart after successful order creation
      try {
        if (typeof clearCart === 'function') {
          await clearCart();
        } else {
          console.warn("clearCart is not a function in ShopContext");
        }
      } catch (clearCartError) {
        console.error("Error clearing cart:", clearCartError);
        toast({
          title: "Cart Issue",
          description: "Order created successfully, but there was an issue clearing your cart.",
          variant: "warning",
        });
      }

      toast({
        title: "Order Completed Successfully!",
        description: `Your order ${order.order_number} has been confirmed and paid.`,
        variant: "success",
      });

      navigate(`/order-payment-success/${order.order_number}`);

      return order;

    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Creation Failed",
        description: "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    clearValidationErrors();

    const isValid = validateForm(formData, createAccount, password);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "error",
      });
      setLoading(false);
      return;
    }

    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      toast({
        title: "Checkout Error",
        description: "Session information is missing or invalid. Please try refreshing the page.",
        variant: "error",
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    let orderNumberForNavigation = null;

    try {
      let customerRecord;
      let isNewAuthUser = false;

      // Step 1: Handle customer creation/update
      if (!user) {
        customerRecord = await customerApi.getOrCreateCustomer(
          {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
          },
          createAccount
        );

        if (!customerRecord || !customerRecord.id) {
          throw new Error("Customer creation or retrieval failed.");
        }

        if (createAccount && typeof customerRecord.id === 'string' && customerRecord.id.length === 36) {
          isNewAuthUser = true;
        }

      } else {
        // For authenticated users, use the backend customers endpoint
        try {
          const customerResult = await api.post('/customers/get-or-create', {
            email: user.email || formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postalCode: formData.postalCode,
            userId: user.id,
          });
          customerRecord = customerResult.customer || customerResult;
        } catch (customerError) {
          console.error("Error getting/creating customer for authenticated user:", customerError);
          throw new Error(`Failed to process customer record: ${customerError.message}`);
        }
      }

      const customerIdToUse = customerRecord.id;
      const userIdToUse = user?.id || (isNewAuthUser ? customerRecord.id : null);

      if (!customerIdToUse) {
        throw new Error("Customer ID is missing after creation/retrieval attempts.");
      }

      // Step 2: Create order with pending status
      const generatedOrderNumber = `TH-${Date.now()}`;
      orderNumberForNavigation = generatedOrderNumber;
      const paymentDetailsGHS = getPaymentAmountAndCurrency(totalAmount);

      const orderPayload = {
        session_id: sessionId,
        user_id: userIdToUse,
        customer_id: customerIdToUse,
        status: "pending",
        total_amount: parseFloat(totalAmount.toFixed(2)),
        currency: "USD",
        payment_status: "pending",
        order_number: generatedOrderNumber,
        base_subtotal: parseFloat(baseSubtotal.toFixed(2)),
        base_shipping: parseFloat(shippingCost.toFixed(2)),
        base_total: parseFloat((baseSubtotal + shippingCost).toFixed(2)),
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_country: formData.country,
        shipping_postal_code: formData.postalCode,
        shipping_phone: formData.phone,
        shipping_email: formData.email,
        notes: formData.orderNotes,
        customer_photo_url: formData.customerPhotoUrl || null,
        items: cart.map(item => ({
          product_id: item.product_id || item.products?.id || null,
          gift_voucher_type_id: item.gift_voucher_type_id || null,
          quantity: item.quantity,
          price: item.is_gift_voucher && item.gift_voucher_types ? item.gift_voucher_types.amount : item.price,
          size: item.size || null,
        })),
      };

      if (appliedCoupon) {
        orderPayload.coupon_id = appliedCoupon.id;
      }
      if (couponDiscountAmount) {
        orderPayload.coupon_discount_amount = parseFloat(couponDiscountAmount.toFixed(2));
      }

      const orderResponse = await api.post('/orders', orderPayload);
      const order = orderResponse.order || orderResponse;

      if (!order || !order.id || !order.order_number) {
        orderNumberForNavigation = null;
        throw new Error("Order creation failed or did not return expected data.");
      }

      orderNumberForNavigation = order.order_number;

      // Send order confirmation notifications for pending orders
      try {
        console.log('Sending order confirmation notifications for order:', order.order_number);
        await sendOrderConfirmation(order);
        console.log('Order confirmation notifications sent successfully');
      } catch (notificationError) {
        console.error('Error sending order confirmation notifications:', notificationError);
      }

      toast({
        title: "Order Created Successfully!",
        description: `Order ${orderNumberForNavigation} has been created. Please proceed to payment.`,
        variant: "success",
      });

      navigate(`/order-confirmation/${orderNumberForNavigation}`);

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: TOAST_MESSAGES.order.createError,
        description: error.message || TOAST_MESSAGES.general.unexpected,
        variant: "error",
      });
      orderNumberForNavigation = null;
      setLoading(false);
    }
  };

  return { handleSubmit };
};
