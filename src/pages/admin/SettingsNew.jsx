import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle, CheckCircle, Settings as SettingsIcon, Store, DollarSign, CreditCard, Shield, Image, Users, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import adminApiClient from '@/lib/services/adminApiClient';
import adminSettingsApi from '@/lib/services/adminSettingsApi';
import { loadExchangeRateFromSettings } from '@/lib/services/exchangeRate';
import { uploadHeroImage, uploadCollectionImage, deleteImage } from '@/lib/services/uploadApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const SettingsNew = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('store');
  
  const [settings, setSettings] = useState({
    store_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    store_description: '',
    currency: 'USD',
    timezone: 'UTC',
    exchange_rate: 16.0,
    paystack_public_key: '',
    paystack_secret_key: '',
    hero_image_url: '',
    hero_title: '',
    hero_subtitle: '',
    hero_button_text: '',
    captcha_enabled: false
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await adminSettingsApi.getSettings();
        if (response.success && response.settings) {
          setSettings({
            store_name: response.settings.store_name || 'Tailored Hands',
            contact_email: response.settings.contact_email || '',
            contact_phone: response.settings.contact_phone || '',
            address: response.settings.address || '',
            store_description: response.settings.store_description || '',
            currency: response.settings.currency || 'USD',
            timezone: response.settings.timezone || 'UTC',
            exchange_rate: response.settings.exchange_rate_ghs || 16.0,
            paystack_public_key: response.settings.paystack_public_key || '',
            paystack_secret_key: response.settings.paystack_secret_key || '',
            hero_image_url: response.settings.hero_image_url || '',
            hero_title: response.settings.hero_title || 'Modern Elegance Redefined',
            hero_subtitle: response.settings.hero_subtitle || 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
            hero_button_text: response.settings.hero_button_text || 'EXPLORE COLLECTION',
            captcha_enabled: response.settings.captcha_enabled || false
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        store_description: settings.store_description,
        currency: settings.currency,
        timezone: settings.timezone,
        exchange_rate_ghs: parseFloat(settings.exchange_rate),
        paystack_public_key: settings.paystack_public_key,
        paystack_secret_key: settings.paystack_secret_key,
        hero_image_url: settings.hero_image_url,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_button_text: settings.hero_button_text,
        captcha_enabled: settings.captcha_enabled
      };

      const response = await adminSettingsApi.updateSettings(settingsToSave);
      if (response.success) {
        toast({
          title: "Settings Saved Successfully",
          description: "Your store settings have been updated and are now active across the website.",
          variant: "default",
        });

        // Reload exchange rate from updated settings
        await loadExchangeRateFromSettings();
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await adminApiClient.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (response.success) {
        toast({
          title: "Password Changed Successfully",
          description: "Your admin password has been updated.",
          variant: "default",
        });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const sections = [
    { id: 'store', label: 'Store Info', icon: Store, color: 'text-blue-600' },
    { id: 'currency', label: 'Currency', icon: DollarSign, color: 'text-green-600' },
    { id: 'payment', label: 'Payment', icon: CreditCard, color: 'text-purple-600' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-red-600' },
    { id: 'appearance', label: 'Appearance', icon: Image, color: 'text-orange-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-[#D2B48C]" />
          <span className="text-lg">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#D2B48C]" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your store configuration and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-[#D2B48C] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${activeSection === section.id ? 'text-white' : section.color}`} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              
              {/* Store Information */}
              {activeSection === 'store' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Store className="h-5 w-5 text-blue-600" />
                        <span>Store Information</span>
                      </CardTitle>
                      <CardDescription>
                        Basic information about your store that customers will see
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="store_name">Store Name</Label>
                          <Input
                            id="store_name"
                            value={settings.store_name}
                            onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                            placeholder="Tailored Hands"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_email">Contact Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                            placeholder="contact@tailoredhands.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact_phone">Contact Phone</Label>
                          <Input
                            id="contact_phone"
                            value={settings.contact_phone}
                            onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                            placeholder="+233 XX XXX XXXX"
                          />
                        </div>
                        <div>
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="Africa/Accra">Africa/Accra (GMT+0)</SelectItem>
                              <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Store Address</Label>
                        <Textarea
                          id="address"
                          value={settings.address}
                          onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your store address"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="store_description">Store Description</Label>
                        <Textarea
                          id="store_description"
                          value={settings.store_description}
                          onChange={(e) => setSettings(prev => ({ ...prev, store_description: e.target.value }))}
                          placeholder="Describe your store and what makes it special"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Currency Settings */}
              {activeSection === 'currency' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Currency Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure your store's currency and exchange rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currency">Primary Currency</Label>
                          <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="exchange_rate">Exchange Rate (GHS per USD)</Label>
                          <Input
                            id="exchange_rate"
                            type="number"
                            step="0.01"
                            value={settings.exchange_rate}
                            onChange={(e) => setSettings(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) || 16.0 }))}
                            placeholder="16.00"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Current rate: 1 USD = {settings.exchange_rate} GHS
                          </p>
                        </div>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Changing the exchange rate will immediately update all product prices across your store. 
                          This affects both the shop page and product detail pages.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Settings */}
              {activeSection === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <span>Payment Configuration</span>
                      </CardTitle>
                      <CardDescription>
                        Configure your payment gateway settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
                        <Input
                          id="paystack_public_key"
                          value={settings.paystack_public_key}
                          onChange={(e) => setSettings(prev => ({ ...prev, paystack_public_key: e.target.value }))}
                          placeholder="pk_test_..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
                        <Input
                          id="paystack_secret_key"
                          type="password"
                          value={settings.paystack_secret_key}
                          onChange={(e) => setSettings(prev => ({ ...prev, paystack_secret_key: e.target.value }))}
                          placeholder="sk_test_..."
                        />
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Keep your secret keys secure. Never share them publicly or commit them to version control.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <span>Security Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Manage security features and admin password
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="captcha_enabled">reCAPTCHA Protection</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Switch
                            id="captcha_enabled"
                            checked={settings.captcha_enabled}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, captcha_enabled: checked }))}
                          />
                          <span className="text-sm text-gray-600">
                            {settings.captcha_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Change Admin Password</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                              id="current_password"
                              type="password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="new_password">New Password</Label>
                              <Input
                                id="new_password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirm_password">Confirm Password</Label>
                              <Input
                                id="confirm_password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handlePasswordChange}
                            disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {changingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing Password...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-orange-600" />
                        <span>Hero Section</span>
                      </CardTitle>
                      <CardDescription>
                        Customize your homepage hero section
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="hero_title">Hero Title</Label>
                        <Input
                          id="hero_title"
                          value={settings.hero_title}
                          onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                          placeholder="Modern Elegance Redefined"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                        <Textarea
                          id="hero_subtitle"
                          value={settings.hero_subtitle}
                          onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                          placeholder="Discover our collection of meticulously crafted pieces..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero_button_text">Button Text</Label>
                        <Input
                          id="hero_button_text"
                          value={settings.hero_button_text}
                          onChange={(e) => setSettings(prev => ({ ...prev, hero_button_text: e.target.value }))}
                          placeholder="EXPLORE COLLECTION"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#D2B48C] hover:bg-[#C4A484] text-white px-8 py-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsNew;
