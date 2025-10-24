import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { emailApi } from '@/lib/services/emailApi';
import { useAuth } from '@/hooks/useAuth';

const EmailTest = () => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    template_type: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    smtp_host: 'smtp.hostinger.com',
    smtp_port: 587,
    smtp_username: 'sales@tailoredhands.africa',
    smtp_password: '',
    from_email: 'sales@tailoredhands.africa',
    from_name: 'TailoredHands',
    reply_to_email: 'sales@tailoredhands.africa'
  });
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <p className="text-lg text-gray-700">Loading authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-800">Access Denied</CardTitle>
            <CardDescription className="text-gray-600">
              You must be logged in to access the email test page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-red-600 mb-4">Please log in to continue.</p>
            <Button onClick={() => window.location.href = '/login'} className="bg-red-600 hover:bg-red-700 text-white">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await emailApi.sendEmail({
        ...emailData,
        smtp_config: smtpConfig
      });
      
      toast({
        title: "Success",
        description: `Email sent successfully to ${emailData.to}!`,
      });
      
      // Clear form
      setEmailData({
        to: '',
        subject: '',
        message: '',
        template_type: 'general'
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!smtpConfig.smtp_password) {
      toast({
        title: "Error",
        description: "Please enter your SMTP password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await emailApi.testEmailWithConfig(smtpConfig, emailData.to || 'test@example.com');
      
      toast({
        title: "Success",
        description: "SMTP configuration test successful!",
      });
    } catch (error) {
      console.error('SMTP test failed:', error);
      toast({
        title: "Error",
        description: error.message || "SMTP configuration test failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100"
    >
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-800">📧 Email System Test</CardTitle>
            <CardDescription className="text-gray-600">
              Test your new email system with SMTP configuration
              <br />
              <strong>For Hostinger:</strong> Use smtp.hostinger.com and your actual email credentials
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">SMTP Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={smtpConfig.smtp_host}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="mail.yourdomain.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={smtpConfig.smtp_port}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_username">SMTP Username</Label>
                <Input
                  id="smtp_username"
                  type="email"
                  value={smtpConfig.smtp_username}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtp_username: e.target.value }))}
                  placeholder="your-email@yourdomain.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={smtpConfig.smtp_password}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="Your email password"
                />
              </div>
            </div>
            
            <Button
              onClick={handleTestSMTP}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Testing SMTP...' : 'Test SMTP Configuration'}
            </Button>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Send Test Email</h3>
            
            <div className="space-y-2">
              <Label htmlFor="to">To Email</Label>
              <Input
                id="to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Test Email Subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Your test message here..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template_type">Template Type</Label>
              <select
                id="template_type"
                value={emailData.template_type}
                onChange={(e) => setEmailData(prev => ({ ...prev, template_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="order_confirmation">Order Confirmation</option>
              </select>
            </div>
            
            <Button
              onClick={handleSendEmail}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Sending Email...' : 'Send Test Email'}
            </Button>
          </div>

          {/* Quick Test Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Quick Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={() => setEmailData({
                  to: 'test@example.com',
                  subject: 'Test Email from TailoredHands',
                  message: 'This is a test email to verify the email system is working correctly.',
                  template_type: 'general'
                })}
                variant="outline"
                className="text-sm"
              >
                Fill Sample Data
              </Button>
              
              <Button
                onClick={() => setEmailData({
                  to: 'test@example.com',
                  subject: 'Order Confirmation - ORD-001',
                  message: 'Thank you for your order!',
                  template_type: 'order_confirmation'
                })}
                variant="outline"
                className="text-sm"
              >
                Fill Order Confirmation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmailTest;
