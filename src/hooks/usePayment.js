import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  getPaymentConfig,
  initializePaystackTransaction,
  verifyPayment, 
  updateOrderPaymentStatus,
  createPaymentRecord
} from '@/lib/services/payment';

export const usePayment = () => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to check if Paystack script is loaded (since it's loaded dynamically in index.html)
  const loadPaystackScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.PaystackPop) {
        console.log('✅ PaystackPop already available');
        resolve(true);
        return;
      }

      console.log('⏳ Waiting for PaystackPop to be available...');
      
      // Since script is loaded dynamically in HTML, just wait for it with reasonable checking
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        console.log(`🔍 Attempt ${attempts}/10: Checking for PaystackPop...`);
        
        if (window.PaystackPop) {
          clearInterval(checkInterval);
          console.log('✅ PaystackPop detected and ready');
          resolve(true);
        } else if (attempts >= 10) { // 5 seconds total
          clearInterval(checkInterval);
          console.warn('⚠️ PaystackPop not available after 10 attempts');
          resolve(true); // Resolve anyway to let the app continue
        }
      }, 500);
    });
  }, []);

  // Check if Paystack script is loaded on hook initialization
  useEffect(() => {
    const checkPaystackScript = () => {
      console.log('🔍 usePayment hook initialized - checking PaystackPop...');
      
      if (window.PaystackPop) {
        console.log('✅ PaystackPop detected immediately');
        setScriptLoaded(true);
      } else {
        console.log('⏳ PaystackPop not yet available, will check periodically...');
        setScriptLoaded(false);
        
        // Try loading with simplified check
        loadPaystackScript()
          .then(() => {
            if (window.PaystackPop) {
              console.log('✅ PaystackPop ready');
              setScriptLoaded(true);
            } else {
              console.warn('⚠️ PaystackPop still not available, but enabling payment system anyway');
              setScriptLoaded(true); // Enable anyway
            }
          });
          
        // Fallback: Auto-enable after 5 seconds as a safety measure
        setTimeout(() => {
          console.log('🔧 Auto-enabling payment system after 5 seconds');
          if (!window.PaystackPop) {
            console.warn('💡 PaystackPop will be checked again when payment is attempted');
          }
          setScriptLoaded(true);
        }, 5000);
      }
    };

    checkPaystackScript();
  }, [loadPaystackScript]);

  // Manual bypass function for testing
  const forceEnablePayment = useCallback(() => {
    console.log('🔓 Manually forcing payment script as loaded for testing...');
    setScriptLoaded(true);
    toast({
      title: "Payment System Enabled",
      description: "Payment has been manually enabled for testing.",
      variant: "default"
    });
  }, [toast]);

  // Manual reset function for stuck states
  const resetPaymentState = useCallback(() => {
    console.log('🔄 Manually resetting payment state...');
    setPaymentLoading(false);
    toast({
      title: "Payment Reset",
      description: "Payment state has been reset. You can try again now.",
      variant: "success"
    });
  }, [toast]);

  // Main payment processing function
  const processPayment = useCallback(async (formData, cartItems, clearCart = null) => {
    console.log('🔄 Starting payment processing');
    console.log('💰 Payment amount (GHS):', formData.totalAmount);
    
    setPaymentLoading(true);
    
    try {
      // Get payment configuration from database
      console.log('⚙️ Getting payment configuration...');
      const config = await getPaymentConfig();
      if (!config?.paystack_public_key) {
        throw new Error('Paystack configuration not found. Please configure payment settings in admin panel.');
      }

      // Check if this is a mock payment
      if (config.isMockPayment || config.paystack_public_key === 'MOCK_TEST_KEY') {
        console.log('🎭 Mock payment detected - simulating successful payment...');
        
        // Simulate payment processing delay
        setTimeout(async () => {
          try {
            const mockReference = `TH-MOCK-${Date.now()}`;
            
            console.log('✅ Mock payment successful:', mockReference);
            
            // Create mock payment record (this may fail if orders table doesn't exist, but that's okay)
            try {
              await createPaymentRecord({
                orderNumber: formData.order_number,
                reference: mockReference,
                amount: formData.totalAmount,
                currency: 'GHS',
                status: 'success',
                gatewayResponse: { mock: true, reference: mockReference }
              });
            } catch (recordError) {
              console.warn('⚠️ Could not create payment record (expected if orders table missing):', recordError);
            }

            // Clear cart after successful payment
            if (clearCart && typeof clearCart === 'function') {
              try {
                await clearCart();
                console.log('🛒 Cart cleared after successful mock payment');
              } catch (clearCartError) {
                console.error('❌ Error clearing cart after payment:', clearCartError);
              }
            }

            setPaymentLoading(false);
            
            toast({
              title: "Mock Payment Successful! 🎉",
              description: `Your test order ${formData.order_number} has been processed successfully.`,
              variant: "success"
            });

            navigate(`/order-payment-success/${formData.order_number}`);
            
          } catch (error) {
            console.error('❌ Mock payment processing error:', error);
            setPaymentLoading(false);
            toast({
              title: "Mock Payment Error",
              description: "There was an issue processing your test payment.",
              variant: "destructive"
            });
          }
        }, 2000); // 2 second delay to simulate processing
        
        return;
      }

      // Original Paystack payment flow (for real keys)
      // Convert amount to kobo (smallest unit)
      const amountInKobo = Math.round(formData.totalAmount * 100);
      const reference = `TH-${Date.now()}`;

      console.log('✅ Payment config ready');
      console.log('🔍 Checking PaystackPop availability...');

      // Ensure Paystack script is loaded
      if (!window.PaystackPop) {
        console.log('🔄 PaystackPop not available, attempting to load...');
        try {
          await loadPaystackScript();
        } catch (error) {
          console.warn('⚠️ Could not load PaystackPop, but continuing anyway');
        }
        
        // Final check
        if (!window.PaystackPop) {
          throw new Error('PaystackPop is not available. Please refresh the page and try again.');
        }
      }

      console.log('✅ PaystackPop confirmed available');

      // Define callback functions with proper scope
      function handlePaymentSuccess(response) {
        console.log('✅ Payment successful:', response);
        setPaymentLoading(false);
        
        // Use async IIFE to handle the async operations
        (async () => {
          try {
            // Verify the payment
            const verification = await verifyPayment(response.reference);
            
            if (verification.success && verification.data.status === 'success') {
              await updateOrderPaymentStatus(formData.order_number, {
                reference: response.reference,
                amount: formData.totalAmount // Use the actual amount from form data
              });

              await createPaymentRecord({
                orderNumber: formData.order_number,
                reference: response.reference,
                amount: formData.totalAmount, // Use the actual amount from form data
                currency: 'GHS',
                status: 'success',
                gatewayResponse: verification.data
              });

              // Clear cart after successful payment
              if (clearCart && typeof clearCart === 'function') {
                try {
                  await clearCart();
                  console.log('🛒 Cart cleared after successful payment');
                } catch (clearCartError) {
                  console.error('❌ Error clearing cart after payment:', clearCartError);
                  // Don't fail the payment flow if cart clearing fails
                }
              }

              toast({
                title: "Payment Successful! 🎉",
                description: `Your order ${formData.order_number} has been confirmed.`,
                variant: "success"
              });

              navigate(`/order-payment-success/${formData.order_number}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment processing error:', error);
            toast({
              title: "Payment Error",
              description: "Payment was successful but there was an issue updating your order.",
              variant: "destructive"
            });
          }
        })();
      }

      function handlePaymentClose() {
        console.log('❌ Payment dialog closed by user');
        setPaymentLoading(false);
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "destructive"
        });
      }

      // Create payment configuration with proper function references
      const paymentConfig = {
        key: config.paystack_public_key,
        email: formData.shipping_email,
        amount: amountInKobo,
        currency: 'GHS',
        ref: reference,
        metadata: {
          order_number: formData.order_number,
          customer_name: `${formData.customers?.first_name || ''} ${formData.customers?.last_name || ''}`.trim(),
          phone: formData.shipping_phone
        },
        callback: handlePaymentSuccess,
        onClose: handlePaymentClose
      };

      console.log('🚀 Launching payment popup...');
      console.log('📄 Payment config:', {
        email: paymentConfig.email,
        amount: paymentConfig.amount,
        currency: paymentConfig.currency,
        ref: paymentConfig.ref,
        callbackType: typeof paymentConfig.callback,
        onCloseType: typeof paymentConfig.onClose
      });

      // Use PaystackPop setup
      const handler = window.PaystackPop.setup(paymentConfig);
      handler.openIframe();

      console.log('🎉 Payment popup should now be visible!');

      // Add safety timeout to reset loading state
      setTimeout(() => {
        if (paymentLoading) {
          console.warn('⚠️ Payment popup timeout, resetting loading state');
          setPaymentLoading(false);
          toast({
            title: "Payment Timeout",
            description: "Payment took too long. Please try again.",
            variant: "warning"
          });
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      setPaymentLoading(false);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Could not initialize payment. Please try again.",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [toast, navigate, paymentLoading, loadPaystackScript]);

  // Function for processing payment for existing orders (retry payment)
  const retryPayment = useCallback(async (orderData, clearCart = null) => {
    console.log('🔄 Starting payment processing for order:', orderData.order_number);
    console.log('💰 Payment amount (GHS):', orderData.total_amount_ghs);
    
    setPaymentLoading(true);
    
    // Define callback functions outside of try-catch to ensure proper scope
    function handlePaymentSuccess(response) {
      console.log('✅ Payment successful:', response);
      setPaymentLoading(false);
      
      // Use async IIFE to handle the async operations
      (async () => {
        try {
          // Verify the payment
          const verification = await verifyPayment(response.reference);
          
          if (verification.success && verification.data.status === 'success') {
            await updateOrderPaymentStatus(orderData.order_number, {
              reference: response.reference,
              amount: verification.data.amount / 100
            });

            await createPaymentRecord({
              orderNumber: orderData.order_number,
              reference: response.reference,
              amount: verification.data.amount / 100,
              currency: 'GHS',
              status: 'success',
              gatewayResponse: verification.data
            });

            toast({
              title: "Payment Successful! 🎉",
              description: `Your order ${orderData.order_number} has been confirmed.`,
              variant: "success"
            });

            navigate(`/order-payment-success/${orderData.order_number}`);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('❌ Payment processing error:', error);
          toast({
            title: "Payment Error",
            description: "Payment was successful but there was an issue updating your order.",
            variant: "destructive"
          });
        }
      })();
    }

    function handlePaymentClose() {
      console.log('❌ Payment dialog closed by user');
      setPaymentLoading(false);
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment process.",
        variant: "destructive"
      });
    }
    
    try {
      // Get payment configuration from database
      console.log('⚙️ Getting payment configuration...');
      const config = await getPaymentConfig();
      if (!config?.paystack_public_key) {
        throw new Error('Paystack configuration not found. Please configure payment settings in admin panel.');
      }

      // Convert amount to kobo (smallest unit)
      const amountInKobo = Math.round(orderData.total_amount_ghs * 100);
      const reference = `TH-${orderData.order_number}-${Date.now()}`;

      console.log('✅ Payment config ready');
      console.log('🔍 Checking PaystackPop availability...');

      // Ensure Paystack script is loaded
      if (!window.PaystackPop) {
        console.log('🔄 PaystackPop not available, attempting to load...');
        try {
          await loadPaystackScript();
        } catch (error) {
          console.warn('⚠️ Could not load PaystackPop, but continuing anyway');
        }
        
        // Final check
        if (!window.PaystackPop) {
          throw new Error('PaystackPop is not available. Please refresh the page and try again.');
        }
      }

      console.log('✅ PaystackPop confirmed available');

      // Create payment configuration with proper function references
      const paymentConfig = {
        key: config.paystack_public_key,
        email: orderData.shipping_email,
        amount: amountInKobo,
        currency: 'GHS',
        ref: reference,
        metadata: {
          order_number: orderData.order_number,
          customer_name: `${orderData.customers?.first_name || ''} ${orderData.customers?.last_name || ''}`.trim(),
          phone: orderData.shipping_phone
        },
        callback: handlePaymentSuccess,
        onClose: handlePaymentClose
      };

      console.log('🚀 Launching payment popup...');
      console.log('📄 Payment config:', {
        email: paymentConfig.email,
        amount: paymentConfig.amount,
        currency: paymentConfig.currency,
        ref: paymentConfig.ref,
        callbackType: typeof paymentConfig.callback,
        onCloseType: typeof paymentConfig.onClose
      });

      // Use PaystackPop setup
      const handler = window.PaystackPop.setup(paymentConfig);
      handler.openIframe();

      console.log('🎉 Payment popup should now be visible!');

      // Add safety timeout to reset loading state
      setTimeout(() => {
        if (paymentLoading) {
          console.warn('⚠️ Payment popup timeout, resetting loading state');
          setPaymentLoading(false);
          toast({
            title: "Payment Timeout",
            description: "Payment took too long. Please try again.",
            variant: "warning"
          });
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      setPaymentLoading(false);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Could not initialize payment. Please try again.",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [toast, navigate, paymentLoading, loadPaystackScript]);

  // Check payment status
  const checkPaymentStatus = useCallback(async (reference) => {
    try {
      const verification = await verifyPayment(reference);
      return {
        success: true,
        status: verification.data.status,
        data: verification.data
      };
    } catch (error) {
      console.error('Payment status check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  return {
    processPayment,
    retryPayment,
    checkPaymentStatus,
    paymentLoading,
    resetPaymentState,
    scriptLoaded,
    forceEnablePayment
  };
}; 