import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Send, CheckCircle, AlertCircle, Server, Mail, Loader2, Cloud } from "lucide-react";
import { testEmail, getEmailConfigStatus } from "@/lib/services/email";
import { sendEmail } from "@/lib/services/email";

const Email = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testEmailData, setTestEmailData] = useState({ 
    to: '', 
    subject: 'Test Email from TailoredHands', 
    message: 'This is a test email from TailoredHands notification system. If you receive this, your email configuration is working correctly!' 
  });
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    template_type: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const emailConfig = getEmailConfigStatus();

  const handleTestEmail = async () => {
    if (!testEmailData.to) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      await testEmail(testEmailData);
      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmailData.to}`,
        variant: "success"
      });
    } catch (error) {
      console.error("Test email error:", error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!formData.to || !formData.subject || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await sendEmail({
        to: formData.to,
        subject: formData.subject,
        message: formData.message,
        template_type: formData.template_type,
        template_data: {
          customer_name: 'Valued Customer'
        }
      });

      toast({
        title: "Email Sent Successfully",
        description: `Email sent to ${formData.to} using ${formData.template_type} template`,
        variant: "success"
      });

      // Reset form
      setFormData({
        to: '',
        subject: '',
        message: '',
        template_type: 'general'
      });
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTemplate = async (templateType) => {
    setTestLoading(true);
    try {
      const testData = {
        general: {
          to: 'test@example.com',
          subject: 'Test Email - General Template',
          message: 'This is a test email using the general template.',
          template_type: 'general'
        },
        'order-confirmation': {
          to: 'test@example.com',
          subject: 'Test Email - Order Confirmation',
          message: 'This is a test order confirmation email.',
          template_type: 'order-confirmation',
          template_data: {
            customer_name: 'John Doe',
            order_number: 'TH-TEST-001',
            order_date: 'January 15, 2024',
            payment_status: 'Pending Payment',
            order_items: [
              { name: 'Custom Suit', size: 'L', quantity: 1, price_display: '$299.99' },
              { name: 'Silk Tie', quantity: 2, price_display: '$49.98' }
            ],
            subtotal_display: '$349.97',
            shipping_display: '$15.00',
            total_display: '$364.97',
            shipping_address: '123 Main Street',
            shipping_city: 'Accra',
            shipping_state: 'Greater Accra',
            shipping_postal_code: '00233',
            shipping_country: 'Ghana',
            order_tracking_url: '#'
          }
        },
        'payment-success': {
          to: 'test@example.com',
          subject: 'Test Email - Payment Success',
          message: 'This is a test payment success email.',
          template_type: 'payment-success',
          template_data: {
            customer_name: 'John Doe',
            order_number: 'TH-TEST-001',
            payment_date: 'January 15, 2024',
            payment_method: 'Card Payment',
            payment_amount: '₵5,839.52',
            transaction_id: 'TXN-TEST-123456',
            order_items: [
              { name: 'Custom Suit', size: 'L', quantity: 1, price_display: '$299.99' },
              { name: 'Silk Tie', quantity: 2, price_display: '$49.98' }
            ],
            subtotal_display: '$349.97',
            shipping_display: '$15.00',
            total_display: '$364.97',
            estimated_delivery_date: 'January 25, 2024',
            order_tracking_url: '#'
          }
        }
      };

      const emailData = testData[templateType];
      if (!emailData) {
        throw new Error('Invalid template type');
      }

      await sendEmail(emailData);

      toast({
        title: "Test Email Sent",
        description: `${templateType} template test sent successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Configuration</h2>
        <p className="text-slate-600">
          Manage your email service settings and send test emails.
        </p>
      </div>

      {/* Email Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">{emailConfig.status}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{emailConfig.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Service Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {emailConfig.features?.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Template Testing:</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestTemplate('general')}
                  disabled={testLoading}
                  className="w-full"
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test General Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestTemplate('order-confirmation')}
                  disabled={testLoading}
                  className="w-full"
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test Order Confirmation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestTemplate('payment-success')}
                  disabled={testLoading}
                  className="w-full"
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test Payment Success
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Email Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Email</CardTitle>
          <CardDescription>
            Send emails using professional HTML templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to">Recipient Email *</Label>
                <Input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="template_type">Email Template</Label>
                <Select value={formData.template_type} onValueChange={(value) => handleInputChange('template_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Template</SelectItem>
                    <SelectItem value="order-confirmation">Order Confirmation</SelectItem>
                    <SelectItem value="payment-success">Payment Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Email subject"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Email message content"
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Server className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Setup Instructions</h3>
            <p className="text-sm text-slate-600">How to configure your Hostinger SMTP credentials.</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <h4 className="font-medium mb-2">1. Deploy the Edge Function</h4>
            <p>Run this command to deploy the email Edge Function to Supabase:</p>
            <code className="block bg-slate-100 p-2 rounded mt-2 text-xs">
              Backend email function not yet implemented
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Configure Environment Variables</h4>
            <p>Set your Hostinger SMTP credentials as secrets in Supabase:</p>
            <code className="block bg-slate-100 p-2 rounded mt-2 text-xs">
              Backend SMTP configuration not yet implemented
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Test Your Configuration</h4>
            <p>Use the test email form above to verify your setup is working correctly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Email;
