import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Embedded HTML templates
const BASE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .email-header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 40px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px; }
        .tagline { font-size: 14px; opacity: 0.9; font-style: italic; }
        .email-content { padding: 40px; background-color: #ffffff; }
        .greeting { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
        .message-content { font-size: 16px; line-height: 1.7; margin-bottom: 30px; color: #374151; }
        .message-content p { margin-bottom: 15px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn-primary { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .order-details { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .order-details h3 { color: #1f2937; margin-bottom: 15px; font-size: 18px; }
        .order-item { border-bottom: 1px solid #e2e8f0; padding: 15px 0; display: flex; justify-content: space-between; align-items: center; }
        .order-item:last-child { border-bottom: none; }
        .item-details { flex: 1; }
        .item-name { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
        .item-meta { font-size: 14px; color: #6b7280; }
        .item-price { font-weight: 600; color: #1f2937; }
        .order-total { border-top: 2px solid #2563eb; padding-top: 15px; margin-top: 15px; text-align: right; }
        .total-label { font-size: 18px; font-weight: bold; color: #1f2937; }
        .total-amount { font-size: 24px; font-weight: bold; color: #2563eb; }
        .email-footer { background-color: #1f2937; color: #9ca3af; padding: 30px 40px; text-align: center; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 25px 0; }
        @media only screen and (max-width: 600px) {
            .email-header, .email-content, .email-footer { padding: 20px; }
            .logo { font-size: 24px; }
            .greeting { font-size: 18px; }
            .message-content { font-size: 14px; }
            .btn-primary { padding: 12px 25px; font-size: 14px; }
            .order-item { flex-direction: column; align-items: flex-start; }
            .item-price { margin-top: 10px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">TailoredHands</div>
            <div class="tagline">Crafting Elegance, Tailoring Excellence</div>
        </div>
        <div class="email-content">
            {{content}}
        </div>
        <div class="email-footer">
            <div style="margin-bottom: 20px;">
                <strong>TailoredHands</strong><br>
                Your trusted partner in bespoke fashion
            </div>
            <div style="margin: 20px 0;">
                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Instagram</a> •
                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a> •
                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Twitter</a>
            </div>
            <div style="font-size: 12px; line-height: 1.5; margin-top: 20px;">
                📧 sales@tailoredhands.africa<br>
                🌐 www.tailoredhands.africa<br>
                📱 Contact us for custom orders and inquiries
            </div>
            <div style="margin-top: 20px; font-size: 11px; opacity: 0.7;">
                © 2024 TailoredHands. All rights reserved.<br>
                This email was sent from TailoredHands e-commerce system.
            </div>
        </div>
    </div>
</body>
</html>`;

const TEMPLATES = {
  'general': `<div class="greeting">Hi {{customer_name}},</div>
<div class="message-content">{{message}}</div>
<div class="message-content">
    <p>Thank you for choosing TailoredHands. We're here to help with any questions or concerns you may have about your order or our products.</p>
    <p><strong>Need assistance?</strong> Our customer service team is ready to help!<br>📧 Email: sales@tailoredhands.africa<br>🌐 Website: www.tailoredhands.africa</p>
</div>`,

  'order-confirmation': `<div class="greeting">Hi {{customer_name}},</div>
<div class="message-content">
    <p>Thank you for your order! We're excited to craft your bespoke pieces with the care and attention to detail that TailoredHands is known for.</p>
    <p>Your order has been received and is currently being processed. You'll receive another email once your payment is confirmed and your items are ready for production.</p>
</div>
<div class="order-details">
    <h3>📋 Order Details</h3>
    <div style="margin-bottom: 20px;">
        <strong>Order Number:</strong> {{order_number}}<br>
        <strong>Order Date:</strong> {{order_date}}<br>
        <strong>Payment Status:</strong> <span style="color: #f59e0b;">{{payment_status}}</span>
    </div>
    <h4 style="margin: 20px 0 15px 0; color: #1f2937;">Items Ordered:</h4>
    {{order_items_html}}
    <div class="order-total">
        <div style="margin-bottom: 10px;">
            <span>Subtotal: {{subtotal_display}}</span><br>
            <span>Shipping: {{shipping_display}}</span>
        </div>
        <div class="total-label">Total: <span class="total-amount">{{total_display}}</span></div>
    </div>
</div>
<div class="btn-container">
    <a href="{{order_tracking_url}}" class="btn-primary">View Order Status</a>
</div>
<div class="message-content">
    <h3 style="color: #1f2937; margin-bottom: 15px;">📍 Shipping Information</h3>
    <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
        <strong>{{customer_name}}</strong><br>
        {{shipping_address}}<br>
        {{shipping_city}}, {{shipping_state}} {{shipping_postal_code}}<br>
        {{shipping_country}}
    </p>
    <div class="divider"></div>
    <h3 style="color: #1f2937; margin-bottom: 15px;">⏰ What Happens Next?</h3>
    <ol style="padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 10px;"><strong>Payment Processing:</strong> Complete your payment to confirm the order</li>
        <li style="margin-bottom: 10px;"><strong>Production:</strong> Our artisans will begin crafting your pieces (3-5 business days)</li>
        <li style="margin-bottom: 10px;"><strong>Quality Check:</strong> Each item undergoes thorough quality inspection</li>
        <li style="margin-bottom: 10px;"><strong>Shipping:</strong> Your order will be carefully packaged and shipped</li>
    </ol>
    <p style="margin-top: 20px;"><strong>Need help?</strong> Our customer service team is here to assist you. Simply reply to this email or contact us at sales@tailoredhands.africa.</p>
</div>`,

  'payment-success': `<div class="greeting">Hi {{customer_name}},</div>
<div class="message-content">
    <p>🎉 <strong>Great news!</strong> Your payment has been successfully processed and your order is now confirmed.</p>
    <p>Our skilled artisans are now ready to begin crafting your bespoke pieces with the meticulous attention to detail that defines TailoredHands.</p>
</div>
<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 20px;">✅ Payment Confirmed</h3>
    <p style="margin: 0; opacity: 0.9;">Amount Charged: <strong>{{payment_amount}}</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Transaction ID: {{transaction_id}}</p>
</div>
<div class="order-details">
    <h3>📋 Order Summary</h3>
    <div style="margin-bottom: 20px;">
        <strong>Order Number:</strong> {{order_number}}<br>
        <strong>Payment Date:</strong> {{payment_date}}<br>
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">✅ Paid & Confirmed</span>
    </div>
    <h4 style="margin: 20px 0 15px 0; color: #1f2937;">Items Ordered:</h4>
    {{order_items_html}}
    <div class="order-total">
        <div style="margin-bottom: 10px;">
            <span>Subtotal: {{subtotal_display}}</span><br>
            <span>Shipping: {{shipping_display}}</span>
        </div>
        <div class="total-label">Total Paid: <span class="total-amount">{{total_display}}</span></div>
    </div>
</div>
<div class="btn-container">
    <a href="{{order_tracking_url}}" class="btn-primary">Track Your Order</a>
</div>
<div class="message-content">
    <h3 style="color: #1f2937; margin-bottom: 15px;">📦 Production Timeline</h3>
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="color: #92400e;">
            <strong>Production:</strong> 3-5 business days<br>
            <strong>Quality Check:</strong> 1 business day<br>
            <strong>Shipping:</strong> 2-3 business days<br>
            <hr style="border: none; border-top: 1px solid #f59e0b; margin: 10px 0;">
            <strong>Estimated Delivery:</strong> {{estimated_delivery_date}}
        </div>
    </div>
    <h3 style="color: #1f2937; margin-bottom: 15px;">💝 Thank You</h3>
    <p>Thank you for choosing TailoredHands for your bespoke fashion needs. Your trust in our craftsmanship means everything to us, and we're committed to delivering pieces that exceed your expectations.</p>
    <p><strong>Questions?</strong> Our team is here to help! Contact us at sales@tailoredhands.africa or reply to this email.</p>
</div>`
};

// Simple template engine
function renderTemplate(templateType: string, subject: string, variables: Record<string, any>): { html: string; text: string } {
  try {
    // Get template content
    const templateContent = TEMPLATES[templateType] || TEMPLATES['general'];
    
    // Process order items if present
    let processedContent = templateContent;
    if (variables.order_items && Array.isArray(variables.order_items)) {
      const orderItemsHtml = variables.order_items.map((item: any) => `
        <div class="order-item">
          <div class="item-details">
            <div class="item-name">${item.name || 'Item'}</div>
            <div class="item-meta">
              ${item.size ? `Size: ${item.size} • ` : ''}Quantity: ${item.quantity || 1}
            </div>
          </div>
          <div class="item-price">${item.price_display || '$0.00'}</div>
        </div>
      `).join('');
      
      processedContent = processedContent.replace('{{order_items_html}}', orderItemsHtml);
    }
    
    // Replace all variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, variables[key] || '');
    });
    
    // Clean up any remaining template tags
    processedContent = processedContent.replace(/{{[^}]+}}/g, '');
    
    // Generate final HTML
    const finalHtml = BASE_TEMPLATE
      .replace('{{subject}}', subject)
      .replace('{{content}}', processedContent);
    
    // Generate plain text version
    const textVersion = processedContent
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    
    return { html: finalHtml, text: textVersion };
    
  } catch (error) {
    console.error('Template rendering error:', error);
    
    // Fallback template
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>${subject}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">TailoredHands</h2>
          <div>${variables.message || 'Thank you for your order!'}</div>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            TailoredHands - Crafting Elegance, Tailoring Excellence<br>
            sales@tailoredhands.africa
          </p>
        </div>
      </body>
      </html>
    `;
    
    return {
      html: fallbackHtml,
      text: variables.message || 'Thank you for your order!'
    };
  }
}

// Email sending function using Resend API with embedded templates
async function sendEmailViaAPI(config: any) {
  const { fromEmail, fromName, to, subject, message, templateType = 'general', templateData = {} } = config;

  // Prepare template variables
  const variables = {
    customer_name: templateData.customer_name || 'Valued Customer',
    message: message,
    ...templateData
  };

  // Generate HTML and text versions using embedded templates
  const { html, text } = renderTemplate(templateType, subject, variables);

  // Create the email payload for Resend API
  const emailData = {
    from: `${fromName} <${fromEmail}>`,
    to: to,
    subject: subject,
    text: text,
    html: html
  };

  // Get Resend API key from environment
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }

  console.log('Sending email via Resend API with embedded template:', {
    to,
    subject: subject.substring(0, 50) + '...',
    from: emailData.from,
    templateType,
    htmlLength: html.length,
    textLength: text.length
  });
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      messageId: result.id || `resend-${Date.now()}`,
      service: 'Resend API',
      templateType
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      to, 
      subject, 
      message, 
      from_name,
      template_type = 'general',
      template_data = {}
    } = await req.json()

    // Validate required fields
    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get email configuration from environment variables
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'sales@tailoredhands.africa'
    const fromName = from_name || Deno.env.get('SMTP_FROM_NAME') || 'TailoredHands'

    // Send email using Resend API with embedded templates
    const result = await sendEmailViaAPI({
      fromEmail,
      fromName,
      to,
      subject,
      message,
      templateType: template_type,
      templateData: template_data
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent successfully via Resend API using ${template_type} template`,
        service: 'Resend_API',
        template_type: template_type,
        to: to,
        from: fromEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 