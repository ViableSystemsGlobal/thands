import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useShop } from '@/context/ShopContext';
import { useCurrency } from '@/context/CurrencyContext';
import { customerApi } from '@/lib/services/customerApi';
import { ordersApi } from '@/lib/services/ordersApi';
import { createPaymentRecord } from '@/lib/services/payment';
import { sendPaymentSuccess } from '@/lib/services/notifications';
import { getPaymentConfig } from '@/lib/services/payment';

export const usePaymentFirst = () => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { clearCart } = useShop();
  const { currency: displayCurrency, exchangeRate, getPaymentAmountAndCurrency } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load Paystack script dynamically
  const loadPaystackScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  // Create order after successful payment
  const createOrderAfterPayment = useCallback(async (paymentDetails, customerRecord, userIdToUse, customerIdToUse, formData, cart, sessionId, appliedCoupon, couponDiscountAmount, baseSubtotal, shippingCost, totalAmount) => {
    try {
      const generatedOrderNumber = `TH-${Date.now()}`;

      const orderPayload = {
        session_id: sessionId,
        user_id: userIdToUse,
        customer_id: customerIdToUse,
        status: "confirmed", // Order is confirmed since payment is successful
        total_amount: parseFloat((baseSubtotal + shippingCost).toFixed(2)), // Record actual order value for business reporting
        total_amount_ghs: parseFloat((totalAmount * 16).toFixed(2)), // Convert to GHS (assuming 16 GHS per USD)
        currency: "USD",
        payment_status: "paid", // Payment is already successful
        order_number: generatedOrderNumber,
        base_subtotal: parseFloat(baseSubtotal.toFixed(2)),
        base_shipping: parseFloat(shippingCost.toFixed(2)),
        base_total: parseFloat((baseSubtotal + shippingCost).toFixed(2)),
        shipping_first_name: formData.firstName,
        shipping_last_name: formData.lastName,
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_country: formData.country,
        shipping_postal_code: formData.postalCode,
        shipping_phone: formData.phone,
        shipping_email: formData.email,
        notes: formData.orderNotes, // Changed from order_notes to notes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_reference: paymentDetails.reference,
        payment_gateway: 'paystack',
        payment_completed_at: new Date().toISOString(),
      };

      // Add discount fields if a coupon or gift voucher was applied
      if (appliedCoupon && appliedCoupon.code) {
        orderPayload.voucher_code = appliedCoupon.code;
      }
      if (couponDiscountAmount) {
        orderPayload.voucher_discount = parseFloat(couponDiscountAmount.toFixed(2));
      }

      // Add items to order payload
      const orderItems = cart.map(item => {
        const orderItem = {
          quantity: item.quantity,
          price: item.is_gift_voucher && item.gift_voucher_types ? item.gift_voucher_types.amount : item.price,
          size: item.size || null
        };

        // Handle product_id - check multiple possible locations
        const productId = item.product_id || (item.products && item.products.id);
        
        // Ensure exactly one of product_id or gift_voucher_type_id is set (not both null)
        if (item.is_gift_voucher && item.gift_voucher_type_id) {
          orderItem.gift_voucher_type_id = item.gift_voucher_type_id;
          orderItem.product_id = null;
        } else if (productId) {
          orderItem.product_id = productId;
          orderItem.gift_voucher_type_id = null;
        } else {
          // This shouldn't happen, but if it does, skip this item
          console.warn('Cart item missing both product_id and gift_voucher_type_id:', item);
          return null;
        }

        return orderItem;
      }).filter(item => item !== null); // Remove any null items

      orderPayload.items = orderItems;

      // Safety check - ensure we have items to create order with
      if (orderItems.length === 0) {
        throw new Error('No valid items found in cart for order creation');
      }


      // Create order using backend API
      const orderResponse = await ordersApi.createOrder(orderPayload);
      
      if (!orderResponse.success || !orderResponse.order) {
        throw new Error("Order creation failed or did not return expected data.");
      }
      
      const order = orderResponse.order;

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

      // Payment record creation is handled by the order creation
      // No need for separate payment record since order includes payment info

      // Send payment success notifications
      try {
        console.log('📧 Sending payment success notifications for order:', order.order_number);

        // Fetch complete order data with relationships for notifications
        try {
          const orderDataForNotification = await ordersApi.getOrderByNumber(order.order_number);
          await sendPaymentSuccess(orderDataForNotification, paymentDetails);
          console.log('✅ Payment success notifications sent successfully');
        } catch (notificationError) {
          console.error('Failed to fetch order data for notifications:', notificationError);
        }
      } catch (notificationError) {
        console.error('Error sending payment success notifications:', notificationError);
        // Don't fail the order creation if notifications fail
      }

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
  }, [toast]);

  // Verify payment with Paystack
  const verifyPayment = useCallback(async (reference) => {
    try {
      // Import the payment service function
      const { verifyPayment: verifyPaymentService } = await import('@/lib/services/payment');
      return await verifyPaymentService(reference);
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }, []);

  // Main payment-first processing function
  const processPaymentFirst = useCallback(async (
    formData,
    password,
    createAccount,
    cart,
    totalAmount,
    baseSubtotal,
    shippingCost,
    user,
    sessionId,
    appliedCoupon,
    couponDiscountAmount,
    validateForm,
    clearValidationErrors
  ) => {
    console.log('🚀 Starting payment-first checkout process');
    console.log('🔍 processPaymentFirst parameters:', {
      totalAmount,
      baseSubtotal,
      shippingCost,
      couponDiscountAmount,
      formData: formData ? 'SET' : 'NOT SET',
      cart: cart ? cart.length : 'NOT SET'
    });
    
    // Clear any previous validation errors
    clearValidationErrors();
    
    // Validate form
    const isValid = validateForm(formData, createAccount, password);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      toast({
        title: "Checkout Error",
        description: "Session information is missing or invalid. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPaymentLoading(true);

    try {
      // Step 1: Handle customer creation/update (but don't create order yet)
      let customerRecord;
      let isNewAuthUser = false;

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
        // Handle authenticated user — look up or create customer by email
        customerRecord = await customerApi.getOrCreateCustomer(
          {
            email: user.email || formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
          },
          false
        );

        if (!customerRecord || !customerRecord.id) {
          throw new Error("Failed to retrieve customer record for authenticated user.");
        }
      }

      const customerIdToUse = customerRecord.id;
      const userIdToUse = user?.id || (isNewAuthUser ? customerRecord.id : null);

      if (!customerIdToUse) {
        throw new Error("Customer ID is missing after creation/retrieval attempts.");
      }

      // Step 2: Process Payment FIRST (before creating order)
      console.log('💳 Processing payment before order creation...');
      console.log('💰 Total amount to pay:', totalAmount);
      
      // Check if payment amount is zero or negative (fully covered by gift voucher)
      if (totalAmount <= 0) {
        console.log('🎫 Order fully covered by gift voucher - no payment required');
        
        const mockReference = `TH-VOUCHER-${Date.now()}`;
        const mockPaymentDetails = {
          reference: mockReference,
          amount: 0,
          verificationData: { 
            voucher_payment: true, 
            reference: mockReference,
            status: 'success',
            amount: 0,
            currency: 'GHS'
          }
        };

        // Create order directly since no payment is needed
        const order = await createOrderAfterPayment(
          mockPaymentDetails,
          customerRecord,
          userIdToUse,
          customerIdToUse,
          formData,
          cart,
          sessionId,
          appliedCoupon,
          couponDiscountAmount,
          baseSubtotal,
          shippingCost,
          totalAmount
        );

        // Clear cart and redirect to success
        await clearCart();
        
        toast({
          title: "Order Completed! 🎉",
          description: `Your order ${order.order_number} has been confirmed. Payment was covered by your gift voucher.`,
          variant: "success",
        });

        navigate(`/order-payment-success/${order.order_number}`);
        return;
      }
      
      // Get payment configuration
      console.log('🚨 DEBUG: About to call getPaymentConfig()');
      const config = await getPaymentConfig();
      console.log('🚨 DEBUG: getPaymentConfig() returned:', config);
      console.log('🔍 Loaded payment config:', {
        config_exists: !!config,
        paystack_public_key: config?.paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: config?.paystack_secret_key ? 'SET' : 'NOT SET',
        full_config: config
      });
      
      if (!config?.paystack_public_key) {
        throw new Error('Paystack configuration not found. Please configure payment settings in admin panel.');
      }

      // Check if this is a mock payment
      if (config.isMockPayment || config.paystack_public_key === 'MOCK_TEST_KEY') {
        console.log('🎭 Mock payment detected - simulating successful payment...');
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockReference = `TH-MOCK-${Date.now()}`;
        const mockPaymentDetails = {
          reference: mockReference,
          amount: totalAmount,
          verificationData: { 
            mock: true, 
            reference: mockReference,
            status: 'success',
            amount: totalAmount * 100, // Convert to kobo for consistency
            currency: 'GHS'
          }
        };

        console.log('✅ Mock payment successful:', mockReference);

        // Step 3: Create order after successful payment
        const order = await createOrderAfterPayment(
          mockPaymentDetails,
          customerRecord,
          userIdToUse,
          customerIdToUse,
          formData,
          cart,
          sessionId,
          appliedCoupon,
          couponDiscountAmount,
          baseSubtotal,
          shippingCost,
          totalAmount
        );

        // Step 4: Clear cart and redirect to success
        await clearCart();
        
        toast({
          title: "Payment Successful! 🎉",
          description: `Your order ${order.order_number} has been confirmed.`,
          variant: "success",
        });

        navigate(`/order-payment-success/${order.order_number}`);
        return;
      }

      // Real Paystack payment flow
      await loadPaystackScript();

      if (!window.PaystackPop) {
        throw new Error('PaystackPop is not available. Please refresh the page and try again.');
      }

      // Validate totalAmount before calculation
      if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
        console.error('❌ Invalid totalAmount:', totalAmount);
        throw new Error(`Invalid cart total: ${totalAmount}. Please ensure your cart has items.`);
      }

      // Check exchange rate
      if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
        console.error('❌ Invalid exchange rate:', exchangeRate);
        throw new Error('Exchange rate not available. Please refresh the page and try again.');
      }

      const paymentDetailsGHS = getPaymentAmountAndCurrency(totalAmount);
      
      // Validate the converted amount
      if (!paymentDetailsGHS || !paymentDetailsGHS.amount || isNaN(paymentDetailsGHS.amount) || paymentDetailsGHS.amount <= 0) {
        console.error('❌ Invalid paymentDetailsGHS:', paymentDetailsGHS);
        throw new Error(`Invalid payment amount calculation. Total: ${totalAmount}, Exchange Rate: ${exchangeRate}, Converted: ${paymentDetailsGHS?.amount}`);
      }

      // Paystack requires amounts in the smallest currency unit
      // For GHS (Ghana Cedis), the smallest unit is pesewas (1 GHS = 100 pesewas)
      // Paystack's API uses "kobo" as a generic term for smallest unit, even for GHS
      // So we convert: GHS amount * 100 = pesewas (which Paystack calls "kobo")
      const amountInGHS = paymentDetailsGHS.amount; // e.g., 50.00 GHS
      const amountInSmallestUnit = Math.round(amountInGHS * 100); // e.g., 5000 pesewas
      const reference = `TH-${Date.now()}`;

      console.log('🔍 Payment calculation debug:', {
        totalAmountUSD: totalAmount,
        exchangeRate,
        amountInGHS: paymentDetailsGHS.amount,
        amountInSmallestUnit, // This is in pesewas for GHS
        currency: paymentDetailsGHS.currency,
        isValidAmount: !isNaN(amountInSmallestUnit) && amountInSmallestUnit > 0
      });

      // Create payment handler functions
      const handlePaymentSuccess = async (response) => {
        console.log('✅ Payment successful:', response);
        
        try {
          // Verify the payment (frontend workaround)
          const verification = await verifyPayment(response.reference);
          
          if (verification.success && verification.data.status === 'success') {
            const paymentDetails = {
              reference: response.reference,
              amount: paymentDetailsGHS.amount, // Use the actual amount from the payment
              verificationData: verification.data
            };

            // Create order after successful payment
            const order = await createOrderAfterPayment(
              paymentDetails,
              customerRecord,
              userIdToUse,
              customerIdToUse,
              formData,
              cart,
              sessionId,
              appliedCoupon,
              couponDiscountAmount,
              baseSubtotal,
              shippingCost,
              totalAmount
            );

            // Clear cart and redirect to success
            await clearCart();
            
            toast({
              title: "Payment Successful! 🎉",
              description: `Your order ${order.order_number} has been confirmed.`,
              variant: "success",
            });

            navigate(`/order-payment-success/${order.order_number}`);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('❌ Payment processing error:', error);
          toast({
            title: "Payment Error",
            description: "Payment was successful but there was an issue creating your order. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setPaymentLoading(false);
          setLoading(false);
        }
      };

      const handlePaymentClose = () => {
        console.log('❌ Payment dialog closed by user');
        setPaymentLoading(false);
        setLoading(false);
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "destructive",
        });
      };

      console.log('🔍 About to create payment configuration with:', {
        config_exists: !!config,
        paystack_public_key: config?.paystack_public_key ? 'SET' : 'NOT SET',
        formData_email: formData?.email,
        amountInGHS,
        amountInSmallestUnit, // Amount in pesewas (Paystack calls it "kobo")
        reference
      });

      // Validate required fields before creating payment config
      if (!config.paystack_public_key) {
        throw new Error('Paystack public key is not configured. Please configure payment settings in admin panel.');
      }

      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('Valid email address is required for payment.');
      }

      if (!amountInSmallestUnit || amountInSmallestUnit <= 0 || isNaN(amountInSmallestUnit)) {
        console.error('❌ Invalid amountInSmallestUnit calculation:', {
          totalAmount,
          exchangeRate,
          paymentDetailsGHS,
          amountInGHS,
          amountInSmallestUnit,
          cartLength: cart?.length,
          baseSubtotal,
          shippingCost,
          couponDiscountAmount
        });
        throw new Error(`Invalid payment amount: ${amountInSmallestUnit} pesewas (${amountInGHS} GHS). Total: ${totalAmount} USD, Exchange Rate: ${exchangeRate}. Please check your cart and try again.`);
      }

      // Create payment configuration - using the same format as working implementations
      // Note: Paystack expects amount in smallest currency unit (pesewas for GHS)
      const paymentConfig = {
        key: config.paystack_public_key,
        email: formData.email.trim(),
        amount: amountInSmallestUnit, // Amount in pesewas (Paystack's API calls it "kobo")
        currency: 'GHS',
        ref: reference,
        metadata: {
          customer_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          cart_items: JSON.stringify(cart.map(item => ({
            name: item.products?.name || item.gift_voucher_types?.name,
            quantity: item.quantity,
            price: item.price
          })))
        },
        callback: handlePaymentSuccess,
        onClose: handlePaymentClose
      };

      console.log('🔍 Payment config being sent to Paystack:', {
        key: paymentConfig.key ? 'SET' : 'NOT SET',
        email: paymentConfig.email,
        amount: paymentConfig.amount, // This is in pesewas (smallest unit)
        amountInGHS: `${(paymentConfig.amount / 100).toFixed(2)} GHS`, // Convert back to GHS for display
        currency: paymentConfig.currency,
        ref: paymentConfig.ref,
        hasValidAmount: !isNaN(paymentConfig.amount) && paymentConfig.amount > 0,
        hasCallback: typeof paymentConfig.callback === 'function',
        hasOnClose: typeof paymentConfig.onClose === 'function'
      });

      console.log('🚀 Launching payment popup...');
      
      // Use PaystackPop.setup() which is the standard and working method
      const handler = window.PaystackPop.setup(paymentConfig);
      handler.openIframe();

      console.log('🎉 Payment popup should now be visible!');

    } catch (error) {
      console.error('❌ Payment-first checkout error:', error);
      setLoading(false);
      setPaymentLoading(false);
      
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    toast,
    navigate,
    clearCart,
    loadPaystackScript,
    verifyPayment,
    createOrderAfterPayment,
    getPaymentAmountAndCurrency
  ]);

  return {
    loading,
    paymentLoading,
    processPaymentFirst
  };
}; 