import { api } from '@/lib/services/api';

// Email API service for the new backend
export const emailApi = {
  // Send email using the new backend API
  sendEmail: async (emailData) => {
    try {
      console.log('📧 Sending email via backend API...');
      
      const response = await api.post('/email/send', {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message,
        template_type: emailData.template_type || 'general',
        template_data: emailData.template_data || {}
      });

      console.log('✅ Email sent successfully via backend API');
      return response;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  },

  // Send order confirmation email
  sendOrderConfirmationEmail: async (orderData) => {
    try {
      const templateData = {
        customer_name: orderData.customer_name || 'Valued Customer',
        order_number: orderData.order_number || orderData.id,
        order_date: orderData.created_at ? new Date(orderData.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        total_amount: orderData.total_amount || orderData.total,
        payment_status: orderData.payment_status || 'Pending',
        message: `Thank you for your order! We're processing it and will send you another email when it ships.`
      };

      return await emailApi.sendEmail({
        to: orderData.customer_email || orderData.email,
        subject: `Order Confirmation - ${templateData.order_number}`,
        message: `Thank you for your order, ${templateData.customer_name}!`,
        template_type: 'order_confirmation',
        template_data: templateData
      });
    } catch (error) {
      console.error('❌ Order confirmation email failed:', error);
      throw error;
    }
  },

  // Send general notification email
  sendNotificationEmail: async (to, subject, message, templateData = {}) => {
    try {
      return await emailApi.sendEmail({
        to,
        subject,
        message,
        template_type: 'general',
        template_data: templateData
      });
    } catch (error) {
      console.error('❌ Notification email failed:', error);
      throw error;
    }
  },

  // Configure SMTP settings (admin only)
  configureSMTP: async (smtpConfig) => {
    try {
      console.log('⚙️ Configuring SMTP settings...');
      
      const response = await api.post('/email/config', smtpConfig);
      
      console.log('✅ SMTP configuration updated successfully');
      return response;
    } catch (error) {
      console.error('❌ SMTP configuration failed:', error);
      throw error;
    }
  },

  // Get current email configuration (admin only)
  getEmailConfig: async () => {
    try {
      const response = await api.get('/email/config');
      return response;
    } catch (error) {
      console.error('❌ Failed to get email configuration:', error);
      throw error;
    }
  },

  // Test email configuration (admin only)
  testEmailConfig: async (smtpConfig, testEmail) => {
    try {
      console.log('🧪 Testing email configuration...');
      
      const response = await api.post('/email/test', {
        smtp_config: smtpConfig,
        test_email: testEmail
      });
      
      console.log('✅ Email configuration test successful');
      return response;
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      throw error;
    }
  },

  // Test email with provided SMTP config (for regular users)
  testEmailWithConfig: async (smtpConfig, testEmail) => {
    try {
      console.log('🧪 Testing email with provided SMTP config...');
      
      const response = await api.post('/email/test-config', {
        smtp_config: smtpConfig,
        test_email: testEmail
      });
      
      console.log('✅ Email test with config successful');
      return response;
    } catch (error) {
      console.error('❌ Email test with config failed:', error);
      throw error;
    }
  },

  // Get email logs (admin only)
  getEmailLogs: async (page = 1, limit = 20, status = null) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await api.get(`/email/logs?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get email logs:', error);
      throw error;
    }
  }
};

// Legacy compatibility - redirect old email service calls to new API
export const sendEmail = emailApi.sendEmail;
export const sendOrderConfirmationEmail = emailApi.sendOrderConfirmationEmail;
