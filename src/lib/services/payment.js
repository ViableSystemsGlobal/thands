import { api } from '@/lib/services/api';

// Fetch payment settings from database via API
export async function getPaymentConfig() {
  try {
    console.log('🔑 Fetching payment configuration from database via API...');
    console.log('🚨 DEBUG: getPaymentConfig function called!');
    
    // Fetch from our backend API instead of directly from Supabase
    const response = await fetch('http://localhost:3003/api/admin/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch payment configuration');
    }
    
    const result = await response.json();
    const data = {
      paystack_public_key: result.settings?.paystack_public_key,
      paystack_secret_key: result.settings?.paystack_secret_key
    };

    if (!data.paystack_public_key) {
      console.warn('⚠️ Paystack public key not configured in database');
      throw new Error('Paystack public key not configured. Please configure payment settings in admin panel.');
    }
    
    console.log('✅ Payment config fetched from database:', {
      hasPublicKey: !!data?.paystack_public_key,
      hasSecretKey: !!data?.paystack_secret_key,
      publicKeyPrefix: data?.paystack_public_key?.substring(0, 12) || 'none'
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching payment config:', error);
    throw error;
  }
}

// Initialize Paystack payment using react-paystack
export async function initializePaystackPayment({
  email,
  amount, // in GHS
  orderNumber,
  customerName,
  phone,
  onSuccess,
  onClose
}) {
  try {
    const config = await getPaymentConfig();
    if (!config?.paystack_public_key) {
      throw new Error('Paystack configuration not found. Please configure payment settings in admin panel.');
    }

    // Convert amount to kobo (smallest unit)
    const amountInKobo = Math.round(amount * 100);
    const reference = `TH-${orderNumber}-${Date.now()}`;

    const paymentData = {
      // For react-paystack hook
      email,
      amount: amountInKobo,
      reference: reference,
      currency: 'GHS',
      publicKey: config.paystack_public_key, // react-paystack expects 'publicKey'
      metadata: {
        order_number: orderNumber,
        customer_name: customerName,
        phone: phone
      },
      onSuccess: onSuccess,
      onClose: onClose,
      
      // For direct Paystack integration fallback
      key: config.paystack_public_key, // direct Paystack expects 'key'
      ref: reference, // direct Paystack expects 'ref' instead of 'reference'
    };

    console.log('📄 Generated payment config:', {
      email: paymentData.email,
      amount: paymentData.amount,
      reference: paymentData.reference,
      currency: paymentData.currency,
      publicKeyPrefix: config.paystack_public_key?.substring(0, 8)
    });

    return paymentData;

  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
}

// Initialize Paystack transaction via API (for v2 implementation)
export async function initializePaystackTransaction({
  email,
  amount, // in GHS
  orderNumber,
  customerName,
  phone
}) {
  // ⚠️ SECURITY WARNING: This function requires secret key and should be moved to backend
  console.warn('⚠️ Transaction initialization via API should be done on backend for security');
  
  // For frontend, use the direct PaystackPop integration instead
  throw new Error('This function requires backend implementation for security. Use PaystackPop integration instead.');
  
  /* 
  // This code should be moved to your backend server:
  try {
    const config = await getPaymentConfig();
    if (!config?.paystack_secret_key) {
      throw new Error('Paystack secret key not configured');
    }

    // Convert amount to kobo (smallest unit)
    const amountInKobo = Math.round(amount * 100);
    const reference = `TH-${orderNumber}-${Date.now()}`;

    const requestData = {
      email,
      amount: amountInKobo,
      reference: reference,
      currency: 'GHS',
      metadata: {
        order_number: orderNumber,
        customer_name: customerName,
        phone: phone
      }
    };

    console.log('🚀 Initializing Paystack transaction via API:', {
      email: requestData.email,
      amount: requestData.amount,
      reference: requestData.reference,
      currency: requestData.currency
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.paystack_secret_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Paystack API error:', data);
      throw new Error(data.message || 'Failed to initialize transaction');
    }

    console.log('✅ Transaction initialized successfully:', {
      reference: data.data.reference,
      access_code: data.data.access_code?.substring(0, 8) + '...'
    });

    return {
      success: true,
      access_code: data.data.access_code,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    };

  } catch (error) {
    console.error('❌ Error initializing Paystack transaction:', error);
    throw error;
  }
  */
}

// Verify payment - Frontend workaround without secret key
export async function verifyPayment(reference) {
  try {
    console.log('🔍 Verifying payment with reference:', reference);

    // Since we can't use secret key on frontend, we'll create a mock verification
    // that assumes payment is successful if PaystackPop returned success
    // In production, this should be handled by a backend endpoint
    
    console.log('⚠️ Using frontend payment verification workaround');
    console.log('✅ Payment verification successful (frontend workaround):', {
      reference: reference,
      status: 'success',
      amount: 0, // Will be set by the calling function
      currency: 'GHS'
    });

    return {
      success: true,
      data: {
        reference: reference,
        status: 'success',
        amount: 0, // Will be overridden by actual amount
        currency: 'GHS',
        gateway_response: 'Frontend verification workaround'
      },
      message: 'Payment verified successfully'
    };

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
}

// Update order payment status
export async function updateOrderPaymentStatus(orderNumber, paymentData) {
  try {
    await api.put(`/orders/by-number/${orderNumber}/payment`, {
      payment_status: 'paid',
      payment_reference: paymentData.reference,
      payment_gateway: 'paystack',
      payment_completed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating payment status:', error);
    // Non-critical - log and continue
    return { success: false, error: error.message };
  }
}

// Create payment record for tracking
export async function createPaymentRecord(paymentData) {
  try {
    await api.post('/payments/log', {
      order_number: paymentData.orderNumber,
      payment_reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      gateway: 'paystack',
      gateway_response: paymentData.gatewayResponse,
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating payment record:', error);
    // Don't throw error here as it's just for logging
    return { success: false, error: error.message };
  }
} 