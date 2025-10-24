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
        status: "confirmed", // Order is confirmed since payment is successful
        total_amount: parseFloat(totalAmount.toFixed(2)),
        currency: "USD", 
        payment_status: "paid", // Payment is already successful
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_reference: paymentDetails.reference,
        payment_gateway: 'paystack',
        payment_completed_at: new Date().toISOString(),
      };

      // Add coupon fields only if they exist
      if (appliedCoupon) {
        orderPayload.coupon_id = appliedCoupon.id;
      }
      if (couponDiscountAmount) {
        orderPayload.coupon_discount_amount = parseFloat(couponDiscountAmount.toFixed(2));
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select('id, order_number') 
        .single();

      if (orderError) throw orderError;
      if (!order || !order.id || !order.order_number) {
        throw new Error("Order creation failed or did not return expected data.");
      }

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        gift_voucher_type_id: item.gift_voucher_type_id || null,
        quantity: item.quantity,
        price: item.is_gift_voucher && item.gift_voucher_types ? item.gift_voucher_types.amount : item.price,
        size: item.size || null,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        throw itemsError;
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
          console.log('🎫 Redeeming gift voucher:', appliedCoupon.code);
          
          // Calculate redemption amount in cents
          const redemptionAmountCents = Math.round(appliedCoupon.calculated_discount * 100);
          
          // Import the redemption function
          const { redeemGiftVoucher } = await import('@/lib/db/issuedGiftVouchers');
          
          // Redeem the gift voucher
          await redeemGiftVoucher(appliedCoupon.id, redemptionAmountCents);
          
          console.log('✅ Gift voucher redeemed successfully:', {
            voucherId: appliedCoupon.id,
            code: appliedCoupon.code,
            redemptionAmount: appliedCoupon.calculated_discount,
            orderNumber: order.order_number
          });
          
          // Update the order with gift voucher redemption info
          await supabase
            .from('orders')
            .update({
              gift_voucher_code: appliedCoupon.code,
              gift_voucher_id: appliedCoupon.id,
              gift_voucher_redemption_amount: appliedCoupon.calculated_discount,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
            
        } catch (voucherError) {
          console.error('Error redeeming gift voucher:', voucherError);
          // Don't fail the order, but log the issue
          toast({
            title: "Gift Voucher Issue",
            description: "Order completed but there was an issue redeeming your gift voucher. Please contact support.",
            variant: "warning",
          });
        }
      }

      // Send payment success notifications
      try {
        console.log('📧 Sending payment success notifications for order:', order.order_number);
        
        // Fetch complete order data with relationships for notifications
        const { data: orderDataForNotification, error: notificationError } = await supabase
          .from('orders')
          .select(`
            *,
            customers (*),
            order_items (
              *,
              products (id, name, description, image_url),
              gift_voucher_types (id, name, amount, description, validity_months, image_url)
            )
          `)
          .eq('id', order.id)
          .single();

        if (!notificationError && orderDataForNotification) {
          await sendPaymentSuccess(orderDataForNotification, paymentDetails);
          console.log('✅ Payment success notifications sent successfully');
        } else {
          console.error('Failed to fetch order data for notifications:', notificationError);
        }
      } catch (notificationError) {
        console.error('Error sending payment success notifications:', notificationError);
        // Don't fail the order creation if notifications fail
      }

      // Send order confirmation notifications for pending orders
      try {
        console.log('📧 Sending order confirmation notifications for order:', order.order_number);
        
        // Fetch complete order data with relationships for notifications
        const { data: orderDataForNotification, error: notificationError } = await supabase
          .from('orders')
          .select(`
            *,
            customers (*),
            order_items (
              *,
              products (id, name, description, image_url),
              gift_voucher_types (id, name, amount, description, validity_months, image_url)
            )
          `)
          .eq('id', order.id)
          .single();

        if (!notificationError && orderDataForNotification) {
          await sendOrderConfirmation(orderDataForNotification);
          console.log('✅ Order confirmation notifications sent successfully');
        } else {
          console.error('Failed to fetch order data for notifications:', notificationError);
        }
      } catch (notificationError) {
        console.error('Error sending order confirmation notifications:', notificationError);
        // Don't fail the order creation if notifications fail
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
        title: "Order Completed Successfully! 🎉",
        description: `Your order ${order.order_number} has been confirmed and paid.`,
        variant: "success",
      });

      // Navigate to success page
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
        // User is authenticated, try to find/update/create customer record
        const { data: existingCustomer, error: customerFindError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (customerFindError) {
          console.error("Error checking for existing customer:", customerFindError);
          throw new Error(`Failed to check customer record: ${customerFindError.message}`);
        }

        if (existingCustomer) {
          // Customer record exists, update it
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update({
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              country: formData.country,
              postal_code: formData.postalCode,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id) 
            .select()
            .single();

          if (updateError) {
            console.warn("Could not update customer address:", updateError.message);
            // If update fails, use existing customer data
            customerRecord = existingCustomer;
          } else {
            customerRecord = updatedCustomer;
          }
        } else {
          // No customer record exists for this user, create one
          const newCustomerRecord = {
            id: user.id, // Use the authenticated user's ID
            email: user.email || formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postal_code: formData.postalCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: createdCustomer, error: createError } = await supabase
            .from('customers')
            .insert([newCustomerRecord])
            .select()
            .single();

          if (createError) {
            console.error("Error creating customer record for authenticated user:", createError);
            throw new Error(`Failed to create customer record: ${createError.message}`);
          }

          customerRecord = createdCustomer;
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add coupon fields only if they exist
      if (appliedCoupon) {
        orderPayload.coupon_id = appliedCoupon.id;
      }
      if (couponDiscountAmount) {
        orderPayload.coupon_discount_amount = parseFloat(couponDiscountAmount.toFixed(2));
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select('id, order_number') 
        .single();

      if (orderError) throw orderError;
      if (!order || !order.id || !order.order_number) {
        orderNumberForNavigation = null; 
        throw new Error("Order creation failed or did not return expected data.");
      }
      
      orderNumberForNavigation = order.order_number; 

      // Step 3: Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        gift_voucher_type_id: item.gift_voucher_type_id || null,
        quantity: item.quantity,
        price: item.is_gift_voucher && item.gift_voucher_types ? item.gift_voucher_types.amount : item.price,
        size: item.size || null,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        orderNumberForNavigation = null; 
        throw itemsError;
      }

      // Send order confirmation notifications for pending orders
      try {
        console.log('📧 Sending order confirmation notifications for order:', order.order_number);
        
        // Fetch complete order data with relationships for notifications
        const { data: orderDataForNotification, error: notificationError } = await supabase
          .from('orders')
          .select(`
            *,
            customers (*),
            order_items (
              *,
              products (id, name, description, image_url),
              gift_voucher_types (id, name, amount, description, validity_months, image_url)
            )
          `)
          .eq('id', order.id)
          .single();

        if (!notificationError && orderDataForNotification) {
          await sendOrderConfirmation(orderDataForNotification);
          console.log('✅ Order confirmation notifications sent successfully');
        } else {
          console.error('Failed to fetch order data for notifications:', notificationError);
        }
      } catch (notificationError) {
        console.error('Error sending order confirmation notifications:', notificationError);
        // Don't fail the order creation if notifications fail
      }

      toast({
        title: "Order Created Successfully! 🎉",
        description: `Order ${orderNumberForNavigation} has been created. Please proceed to payment.`,
        variant: "success",
      });

      // Step 5: Navigate to order confirmation page for payment
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
