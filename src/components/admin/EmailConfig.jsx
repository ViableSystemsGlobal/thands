import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { emailApi } from '@/lib/services/emailApi';

const EmailConfig = () => {
  const [config, setConfig] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'TailoredHands',
    reply_to_email: '',
    is_active: true
  });
  
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await emailApi.getEmailConfig();
      if (response.config) {
        setCurrentConfig(response.config);
        // Don't load password for security
        setConfig(prev => ({
          ...prev,
          smtp_host: response.config.smtp_host || '',
          smtp_port: response.config.smtp_port || 587,
          smtp_username: response.config.smtp_username || '',
          smtp_password: '', // Don't show existing password
          from_email: response.config.from_email || '',
          from_name: response.config.from_name || 'TailoredHands',
          reply_to_email: response.config.reply_to_email || '',
          is_active: response.config.is_active
        }));
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
      toast({
        title: "Error",
        description: "Failed to load current email configuration.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await emailApi.configureSMTP(config);
      
      toast({
        title: "Success",
        description: "Email configuration saved successfully!",
      });
      
      loadCurrentConfig();
    } catch (error) {
      console.error('Failed to save email config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save email configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      await emailApi.testEmailConfig(config, testEmail);
      
      toast({
        title: "Success",
        description: `Test email sent successfully to ${testEmail}!`,
      });
    } catch (error) {
      console.error('Email test failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">📧 Email Configuration</CardTitle>
            <CardDescription>
              Configure SMTP settings for sending emails through Hostinger
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SMTP Host */}
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                type="text"
                placeholder="mail.yourdomain.com"
                value={config.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Usually: mail.yourdomain.com or smtp.yourdomain.com
              </p>
            </div>

            {/* SMTP Port */}
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                placeholder="587"
                value={config.smtp_port}
                onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value) || 587)}
              />
              <p className="text-sm text-gray-600">
                Common ports: 587 (STARTTLS) or 465 (SSL)
              </p>
            </div>

            {/* SMTP Username */}
            <div className="space-y-2">
              <Label htmlFor="smtp_username">SMTP Username</Label>
              <Input
                id="smtp_username"
                type="email"
                placeholder="your-email@yourdomain.com"
                value={config.smtp_username}
                onChange={(e) => handleInputChange('smtp_username', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Your full email address
              </p>
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label htmlFor="smtp_password">SMTP Password</Label>
              <Input
                id="smtp_password"
                type="password"
                placeholder="Your email password"
                value={config.smtp_password}
                onChange={(e) => handleInputChange('smtp_password', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                {currentConfig ? 'Leave blank to keep current password' : 'Your email account password'}
              </p>
            </div>

            {/* From Email */}
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={config.from_email}
                onChange={(e) => handleInputChange('from_email', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                The email address that will appear as the sender
              </p>
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                type="text"
                placeholder="TailoredHands"
                value={config.from_name}
                onChange={(e) => handleInputChange('from_name', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                The display name for the sender
              </p>
            </div>

            {/* Reply To Email */}
            <div className="space-y-2">
              <Label htmlFor="reply_to_email">Reply To Email (Optional)</Label>
              <Input
                id="reply_to_email"
                type="email"
                placeholder="support@yourdomain.com"
                value={config.reply_to_email}
                onChange={(e) => handleInputChange('reply_to_email', e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Where replies will be sent (defaults to From Email if empty)
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={config.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Configuration</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              <Button
                variant="outline"
                onClick={loadCurrentConfig}
                disabled={loading}
              >
                Reload Current Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Test Email Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-green-800">🧪 Test Email Configuration</CardTitle>
            <CardDescription>
              Send a test email to verify your SMTP configuration is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_email">Test Email Address</Label>
              <Input
                id="test_email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            
            <Button
              onClick={handleTest}
              disabled={testing || !testEmail}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {testing ? 'Sending Test Email...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Configuration Display */}
      {currentConfig && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">📋 Current Configuration</CardTitle>
              <CardDescription>
                Currently active email configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">SMTP Host</Label>
                  <p className="text-sm">{currentConfig.smtp_host}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">SMTP Port</Label>
                  <p className="text-sm">{currentConfig.smtp_port}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">From Email</Label>
                  <p className="text-sm">{currentConfig.from_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">From Name</Label>
                  <p className="text-sm">{currentConfig.from_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Reply To</Label>
                  <p className="text-sm">{currentConfig.reply_to_email || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      currentConfig.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentConfig.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmailConfig;
