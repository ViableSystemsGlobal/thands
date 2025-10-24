import { api } from '@/lib/services/api';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from './email';

// Notification templates
const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: {
    subject: (orderNumber) => `Order Confirmation - ${orderNumber}`,
    body: (data) => `
Dear ${data.customerName},

Thank you for your order! Your order has been successfully placed and is being processed.

Order Details:
- Order Number: ${data.orderNumber}
- Total Amount: ${data.totalAmount}
- Payment Status: ${data.paymentStatus}

Items Ordered:
${data.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ${item.price}`).join('\n')}

Shipping Address:
${data.shippingAddress}

We'll send you another email once your order ships.

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
    `
  },
  
  PAYMENT_SUCCESS: {
    subject: (orderNumber) => `Payment Confirmed - Order ${orderNumber}`,
    body: (data) => `
Dear ${data.customerName},

Great news! Your payment has been successfully processed.

Payment Details:
- Order Number: ${data.orderNumber}
- Amount Paid: ${data.amountPaid}
- Payment Reference: ${data.paymentReference}
- Payment Method: ${data.paymentMethod}

Your order is now confirmed and will be processed for shipping.

You can track your order status at: ${data.trackingUrl}

Thank you for your purchase!

Best regards,
The TailoredHands Team
    `
  },
  
  ORDER_SHIPPED: {
    subject: (orderNumber) => `Your Order ${orderNumber} Has Shipped!`,
    body: (data) => `
Dear ${data.customerName},

Exciting news! Your order has been shipped and is on its way to you.

Shipping Details:
- Order Number: ${data.orderNumber}
- Tracking Number: ${data.trackingNumber || 'Will be provided by courier'}
- Estimated Delivery: ${data.estimatedDelivery || '3-5 business days'}

Your package contains:
${data.items.map(item => `- ${item.name} (Qty: ${item.quantity})`).join('\n')}

Delivery Address:
${data.shippingAddress}

You'll receive another notification once your package is delivered.

Thank you for shopping with TailoredHands!

Best regards,
The TailoredHands Team
    `
  },
  
  ORDER_DELIVERED: {
    subject: (orderNumber) => `Order ${orderNumber} Delivered Successfully`,
    body: (data) => `
Dear ${data.customerName},

Your order has been successfully delivered!

Delivery Details:
- Order Number: ${data.orderNumber}
- Delivered On: ${data.deliveryDate}
- Delivered To: ${data.shippingAddress}

We hope you love your purchase! If you have any questions or concerns, please don't hesitate to contact us.

We'd love to hear about your experience. Consider leaving a review or sharing your photos with us on social media.

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
    `
  },
  
  GIFT_VOUCHER_PURCHASE: {
    subject: (voucherCode) => `Your TailoredHands Gift Voucher - ${voucherCode}`,
    body: (data) => `
Dear ${data.customerName},

Thank you for purchasing a TailoredHands gift voucher!

Gift Voucher Details:
- Voucher Code: ${data.voucherCode}
- Amount: ${data.amount}
- Valid Until: ${data.expiryDate}
- Order Number: ${data.orderNumber}

How to Use:
1. Visit our website: tailoredhands.com
2. Select your items and proceed to checkout
3. Enter voucher code: ${data.voucherCode}
4. The voucher amount will be applied to your order

This voucher can be used for any products on our website and makes a perfect gift!

Terms & Conditions:
- Voucher is non-refundable
- Cannot be exchanged for cash
- Valid for single use only
- Must be used before expiry date

Thank you for choosing TailoredHands!

Best regards,
The TailoredHands Team
    `
  }
};

const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: (data) => 
    `Hi ${data.customerName}! Your TailoredHands order ${data.orderNumber} has been placed successfully. Total: ${data.totalAmount}. We'll update you on the progress. Thank you!`,
  
  PAYMENT_SUCCESS: (data) => 
    `Payment confirmed! Your order ${data.orderNumber} (${data.amountPaid}) has been paid successfully. We're processing your order now. Thanks for choosing TailoredHands!`,
  
  ORDER_SHIPPED: (data) => 
    `Great news! Your order ${data.orderNumber} has shipped and is on its way to you. ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : 'You\'ll receive tracking details soon.'}`,
  
  ORDER_DELIVERED: (data) => 
    `Your TailoredHands order ${data.orderNumber} has been delivered! We hope you love your purchase. Thank you for shopping with us!`,
  
  GIFT_VOUCHER_PURCHASE: (data) => 
    `Your TailoredHands gift voucher is ready! Code: ${data.voucherCode}, Amount: ${data.amount}, Valid until: ${data.expiryDate}. Enjoy shopping!`
};

// Get notification settings
export async function getNotificationSettings() {
  try {
    // For now, return default settings since we don't have notification settings in backend yet
    // TODO: Implement notification settings endpoint in backend
    
    // Default settings if none exist
    return {
      email_enabled: true,
      sms_enabled: true,
      order_confirmation_email: true,
      order_confirmation_sms: true,
      payment_success_email: true,
      payment_success_sms: true,
      order_shipped_email: true,
      order_shipped_sms: true,
      order_delivered_email: true,
      order_delivered_sms: false,
      gift_voucher_email: true,
      gift_voucher_sms: false
    };
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    // Return default settings on error
    return {
      email_enabled: true,
      sms_enabled: true,
      order_confirmation_email: true,
      order_confirmation_sms: true,
      payment_success_email: true,
      payment_success_sms: true,
      order_shipped_email: true,
      order_shipped_sms: true,
      order_delivered_email: true,
      order_delivered_sms: false,
      gift_voucher_email: true,
      gift_voucher_sms: false
    };
  }
}

// Log notification attempts
async function logNotification({ type, recipient, method, status, error_message, order_id, metadata }) {
  try {
    // TODO: Implement notification logging in backend
    console.log('📧 Notification logged:', { type, recipient, method, status, order_id });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

// Send order confirmation notifications
export async function sendOrderConfirmation(orderData) {
  try {
    const settings = await getNotificationSettings();
    const results = { email: null, sms: null };

    // Send email notification using HTML template
    if (settings.email_enabled && settings.order_confirmation_email) {
      try {
        await sendOrderConfirmationEmail(orderData);
        
        results.email = { success: true };
        await logNotification({
          type: 'order_confirmation',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending order confirmation email:', error);
        results.email = { success: false, error: error.message };
        await logNotification({
          type: 'order_confirmation',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.order_confirmation_sms && orderData.shipping_phone) {
      try {
        const notificationData = {
          customerName: `${orderData.customers.first_name} ${orderData.customers.last_name}`,
          orderNumber: orderData.order_number,
          totalAmount: `GH₵${orderData.total_amount_ghs?.toFixed(2)}`,
          trackingUrl: `${window.location.origin}/order-confirmation/${orderData.order_number}`
        };

        await sendSMS({
          destination: orderData.shipping_phone,
          message: SMS_TEMPLATES.ORDER_CONFIRMATION(notificationData)
        });
        
        results.sms = { success: true };
        await logNotification({
          type: 'order_confirmation',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending order confirmation SMS:', error);
        results.sms = { success: false, error: error.message };
        await logNotification({
          type: 'order_confirmation',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendOrderConfirmation:', error);
    throw error;
  }
}

// Send payment success notifications
export async function sendPaymentSuccess(orderData, paymentData) {
  try {
    const settings = await getNotificationSettings();
    const results = { email: null, sms: null };

    // Send email notification using HTML template
    if (settings.email_enabled && settings.payment_success_email) {
      try {
        await sendPaymentSuccessEmail(orderData, paymentData);
        
        results.email = { success: true };
        await logNotification({
          type: 'payment_success',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending payment success email:', error);
        results.email = { success: false, error: error.message };
        await logNotification({
          type: 'payment_success',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.payment_success_sms && orderData.shipping_phone) {
      try {
        const notificationData = {
          customerName: `${orderData.first_name || orderData.shipping_first_name} ${orderData.last_name || orderData.shipping_last_name}`,
          orderNumber: orderData.order_number,
          amountPaid: `GH₵${typeof orderData.total_amount_ghs === 'number' ? orderData.total_amount_ghs.toFixed(2) : parseFloat(orderData.total_amount_ghs || 0).toFixed(2)}`,
          paymentReference: paymentData.reference || orderData.payment_reference,
          paymentMethod: 'Paystack',
          trackingUrl: `${window.location.origin}/order-status/${orderData.order_number}`
        };

        await sendSMS({
          destination: orderData.shipping_phone,
          message: SMS_TEMPLATES.PAYMENT_SUCCESS(notificationData)
        });
        
        results.sms = { success: true };
        await logNotification({
          type: 'payment_success',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending payment success SMS:', error);
        results.sms = { success: false, error: error.message };
        await logNotification({
          type: 'payment_success',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendPaymentSuccess:', error);
    throw error;
  }
}

// Send order shipped notifications
export async function sendOrderShipped(orderData, shippingData = {}) {
  try {
    const settings = await getNotificationSettings();
    const notificationData = {
      customerName: `${orderData.customers.first_name} ${orderData.customers.last_name}`,
      orderNumber: orderData.order_number,
      trackingNumber: shippingData.trackingNumber,
      estimatedDelivery: shippingData.estimatedDelivery,
      items: orderData.order_items.map(item => ({
        name: item.products?.name || item.gift_voucher_types?.name || 'Product',
        quantity: item.quantity
      })),
      shippingAddress: `${orderData.shipping_address}, ${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_postal_code}, ${orderData.shipping_country}`
    };

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled && settings.order_shipped_email) {
      try {
        await sendEmail({
          to: orderData.shipping_email,
          subject: EMAIL_TEMPLATES.ORDER_SHIPPED.subject(orderData.order_number),
          message: EMAIL_TEMPLATES.ORDER_SHIPPED.body(notificationData)
        });
        
        results.email = { success: true };
        await logNotification({
          type: 'order_shipped',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'sent',
          order_id: orderData.id,
          metadata: shippingData
        });
      } catch (error) {
        console.error('Error sending order shipped email:', error);
        results.email = { success: false, error: error.message };
        await logNotification({
          type: 'order_shipped',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.order_shipped_sms && orderData.shipping_phone) {
      try {
        await sendSMS({
          destination: orderData.shipping_phone,
          message: SMS_TEMPLATES.ORDER_SHIPPED(notificationData)
        });
        
        results.sms = { success: true };
        await logNotification({
          type: 'order_shipped',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending order shipped SMS:', error);
        results.sms = { success: false, error: error.message };
        await logNotification({
          type: 'order_shipped',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendOrderShipped:', error);
    throw error;
  }
}

// Send order delivered notifications
export async function sendOrderDelivered(orderData, deliveryData = {}) {
  try {
    const settings = await getNotificationSettings();
    const notificationData = {
      customerName: `${orderData.customers.first_name} ${orderData.customers.last_name}`,
      orderNumber: orderData.order_number,
      deliveryDate: deliveryData.deliveryDate || new Date().toLocaleDateString(),
      shippingAddress: `${orderData.shipping_address}, ${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_postal_code}, ${orderData.shipping_country}`
    };

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled && settings.order_delivered_email) {
      try {
        await sendEmail({
          to: orderData.shipping_email,
          subject: EMAIL_TEMPLATES.ORDER_DELIVERED.subject(orderData.order_number),
          message: EMAIL_TEMPLATES.ORDER_DELIVERED.body(notificationData)
        });
        
        results.email = { success: true };
        await logNotification({
          type: 'order_delivered',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'sent',
          order_id: orderData.id,
          metadata: deliveryData
        });
      } catch (error) {
        console.error('Error sending order delivered email:', error);
        results.email = { success: false, error: error.message };
        await logNotification({
          type: 'order_delivered',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.order_delivered_sms && orderData.shipping_phone) {
      try {
        await sendSMS({
          destination: orderData.shipping_phone,
          message: SMS_TEMPLATES.ORDER_DELIVERED(notificationData)
        });
        
        results.sms = { success: true };
        await logNotification({
          type: 'order_delivered',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending order delivered SMS:', error);
        results.sms = { success: false, error: error.message };
        await logNotification({
          type: 'order_delivered',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendOrderDelivered:', error);
    throw error;
  }
}

// Send gift voucher purchase notifications
export async function sendGiftVoucherPurchase(orderData, voucherData) {
  try {
    const settings = await getNotificationSettings();
    const notificationData = {
      customerName: `${orderData.customers.first_name} ${orderData.customers.last_name}`,
      voucherCode: voucherData.voucher_code,
      amount: `$${voucherData.amount}`,
      expiryDate: voucherData.expiry_date,
      orderNumber: orderData.order_number
    };

    const results = { email: null, sms: null };

    // Send email notification
    if (settings.email_enabled && settings.gift_voucher_email) {
      try {
        await sendEmail({
          to: orderData.shipping_email,
          subject: EMAIL_TEMPLATES.GIFT_VOUCHER_PURCHASE.subject(voucherData.voucher_code),
          message: EMAIL_TEMPLATES.GIFT_VOUCHER_PURCHASE.body(notificationData)
        });
        
        results.email = { success: true };
        await logNotification({
          type: 'gift_voucher_purchase',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'sent',
          order_id: orderData.id,
          metadata: voucherData
        });
      } catch (error) {
        console.error('Error sending gift voucher email:', error);
        results.email = { success: false, error: error.message };
        await logNotification({
          type: 'gift_voucher_purchase',
          recipient: orderData.shipping_email,
          method: 'email',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    // Send SMS notification
    if (settings.sms_enabled && settings.gift_voucher_sms && orderData.shipping_phone) {
      try {
        await sendSMS({
          destination: orderData.shipping_phone,
          message: SMS_TEMPLATES.GIFT_VOUCHER_PURCHASE(notificationData)
        });
        
        results.sms = { success: true };
        await logNotification({
          type: 'gift_voucher_purchase',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'sent',
          order_id: orderData.id
        });
      } catch (error) {
        console.error('Error sending gift voucher SMS:', error);
        results.sms = { success: false, error: error.message };
        await logNotification({
          type: 'gift_voucher_purchase',
          recipient: orderData.shipping_phone,
          method: 'sms',
          status: 'failed',
          error_message: error.message,
          order_id: orderData.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendGiftVoucherPurchase:', error);
    throw error;
  }
}

// Utility function to trigger notifications based on order status changes
export async function handleOrderStatusChange(orderId, newStatus, previousStatus, additionalData = {}) {
  try {
    // Fetch complete order data
    const { data: orderData, error } = await supabase
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
      .eq('id', orderId)
      .single();

    if (error) throw error;

    console.log(`📧 Handling order status change: ${previousStatus} -> ${newStatus} for order ${orderData.order_number}`);

    // Send appropriate notifications based on status change
    switch (newStatus) {
      case 'confirmed':
        if (previousStatus === 'pending') {
          await sendOrderConfirmation(orderData);
        }
        break;
        
      case 'paid':
        await sendPaymentSuccess(orderData, additionalData);
        break;
        
      case 'shipped':
        await sendOrderShipped(orderData, additionalData);
        break;
        
      case 'delivered':
        await sendOrderDelivered(orderData, additionalData);
        break;
    }

    // Handle gift voucher notifications
    const hasGiftVouchers = orderData.order_items.some(item => item.gift_voucher_type_id);
    if (hasGiftVouchers && newStatus === 'paid' && additionalData.voucherData) {
      await sendGiftVoucherPurchase(orderData, additionalData.voucherData);
    }

  } catch (error) {
    console.error('Error handling order status change notifications:', error);
  }
}

// Get notification statistics
export async function getNotificationStats(timeframe = '30 days') {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (timeframe === '7 days' ? 7 : 30));

    const { data, error } = await supabase
      .from('notification_logs')
      .select('type, method, status')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      successful: data.filter(n => n.status === 'sent').length,
      failed: data.filter(n => n.status === 'failed').length,
      byType: {},
      byMethod: {}
    };

    // Group by type and method
    data.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byMethod[notification.method] = (stats.byMethod[notification.method] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      byType: {},
      byMethod: {}
    };
  }
} 