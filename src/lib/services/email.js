import { supabase } from '@/lib/supabase';

// Enhanced email service using Supabase Edge Function with HTML templates
export async function sendEmail({ 
  to, 
  subject, 
  message, 
  from_name,
  template_type = 'general',
  template_data = {} 
}) {
  try {
    console.log(`📧 Sending email via ${template_type} template...`);

    // Call the Supabase Edge Function with template support
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: to,
        subject: subject,
        message: message,
        from_name: from_name || 'TailoredHands',
        template_type: template_type,
        template_data: template_data
      }
    });

    if (error) {
      throw new Error(error.message || 'Edge Function error');
    }

    if (!data.success) {
      throw new Error(data.error || 'Email sending failed');
    }

    console.log(`✅ Email sent successfully using ${template_type} template`);
    return data;

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

// Helper function to send order confirmation email
export async function sendOrderConfirmationEmail(orderData) {
  const templateData = {
    customer_name: `${orderData.customers?.first_name} ${orderData.customers?.last_name}`.trim() || 'Valued Customer',
    order_number: orderData.order_number,
    order_date: new Date(orderData.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    payment_status: orderData.payment_status === 'paid' ? 'Paid' : 'Pending Payment',
    order_items: orderData.order_items?.map(item => ({
      name: item.products?.name || item.gift_voucher_types?.name || 'Item',
      size: item.size || null,
      quantity: item.quantity,
      price_display: `$${(item.price * item.quantity).toFixed(2)}`
    })) || [],
    subtotal_display: `$${typeof orderData.base_subtotal === 'number' ? orderData.base_subtotal.toFixed(2) : parseFloat(orderData.base_subtotal || 0).toFixed(2) || '0.00'}`,
    shipping_display: `$${typeof orderData.base_shipping === 'number' ? orderData.base_shipping.toFixed(2) : parseFloat(orderData.base_shipping || 0).toFixed(2) || '0.00'}`,
    total_display: `$${typeof orderData.base_total === 'number' ? orderData.base_total.toFixed(2) : parseFloat(orderData.base_total || 0).toFixed(2) || '0.00'}`,
    shipping_address: orderData.shipping_address,
    shipping_city: orderData.shipping_city,
    shipping_state: orderData.shipping_state,
    shipping_postal_code: orderData.shipping_postal_code,
    shipping_country: orderData.shipping_country,
    order_tracking_url: `${window.location.origin}/order-confirmation/${orderData.order_number}`
  };

  return await sendEmail({
    to: orderData.shipping_email,
    subject: `Order Confirmation - ${orderData.order_number}`,
    message: `Your order ${orderData.order_number} has been received and is being processed.`,
    template_type: 'order-confirmation',
    template_data: templateData
  });
}

// Helper function to send payment success email
export async function sendPaymentSuccessEmail(orderData, paymentDetails) {
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 10); // 10 days from now

  const templateData = {
    customer_name: `${orderData.customers?.first_name} ${orderData.customers?.last_name}`.trim() || 'Valued Customer',
    order_number: orderData.order_number,
    payment_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    payment_method: 'Card Payment',
    payment_amount: `₵${typeof orderData.total_amount_ghs === 'number' ? orderData.total_amount_ghs.toFixed(2) : parseFloat(orderData.total_amount_ghs || 0).toFixed(2)}`,
    transaction_id: paymentDetails.reference || 'N/A',
    order_items: orderData.order_items?.map(item => ({
      name: item.products?.name || item.gift_voucher_types?.name || 'Item',
      size: item.size || null,
      quantity: item.quantity,
      price_display: `$${(item.price * item.quantity).toFixed(2)}`
    })) || [],
    subtotal_display: `$${typeof orderData.base_subtotal === 'number' ? orderData.base_subtotal.toFixed(2) : parseFloat(orderData.base_subtotal || 0).toFixed(2) || '0.00'}`,
    shipping_display: `$${typeof orderData.base_shipping === 'number' ? orderData.base_shipping.toFixed(2) : parseFloat(orderData.base_shipping || 0).toFixed(2) || '0.00'}`,
    total_display: `$${typeof orderData.base_total === 'number' ? orderData.base_total.toFixed(2) : parseFloat(orderData.base_total || 0).toFixed(2) || '0.00'}`,
    estimated_delivery_date: estimatedDelivery.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    order_tracking_url: `${window.location.origin}/order-payment-success/${orderData.order_number}`
  };

  return await sendEmail({
    to: orderData.shipping_email,
    subject: `Payment Confirmed - Order ${orderData.order_number}`,
    message: `Your payment has been successfully processed for order ${orderData.order_number}.`,
    template_type: 'payment-success',
    template_data: templateData
  });
}

// Function to check email service configuration status
export function getEmailServiceStatus() {
  return {
    configured: true,
    service: 'Resend API via Supabase Edge Function',
    features: [
      'HTML Email Templates',
      'Order Confirmation Emails',
      'Payment Success Emails',
      'Responsive Design',
      'Professional Branding'
    ]
  };
}

export async function testEmail({ to, subject, message }) {
  if (!to) throw new Error('Recipient email is required');
  if (!subject) throw new Error('Subject is required');
  if (!message) throw new Error('Message is required');

  try {
    const result = await sendEmail({ to, subject, message });
    return {
      success: true,
      message: result.message,
      data: result.data
    };
  } catch (error) {
    console.error('Test email error:', error);
    throw new Error(error.message || 'Failed to send test email');
  }
}

// Helper function to get current email configuration status
export function getEmailConfigStatus() {
  return {
    service: 'Resend API via Supabase Edge Function',
    status: '🚀 Ready with Resend API',
    description: 'Email service configured to send emails through Resend API via Supabase Edge Function. Resend provides reliable email delivery with great deliverability rates.',
    setup_required: 'Ready to send emails through Resend!'
  };
}
