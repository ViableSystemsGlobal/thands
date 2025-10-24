import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
// SMS communication functionality temporarily disabled - backend endpoints not yet implemented
import { Save, Loader2, MessageSquare, Send, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { testSMS } from "@/lib/services/sms";

const SMSServiceCard = ({ service, isSelected, onSelect, icon: Icon, description, features }) => (
  <div 
    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
      isSelected 
        ? 'border-green-500 bg-green-50 shadow-lg' 
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
    }`}
    onClick={() => onSelect(service)}
  >
    <div className="flex items-center gap-3 mb-3">
      <Icon className={`h-6 w-6 ${isSelected ? 'text-green-600' : 'text-slate-500'}`} />
      <h3 className={`font-semibold ${isSelected ? 'text-green-900' : 'text-slate-800'}`}>{service}</h3>
    </div>
    <p className="text-sm text-slate-600 mb-3">{description}</p>
    <ul className="text-xs text-slate-500 space-y-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

const SMS = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [testSMSData, setTestSMSData] = useState({ 
    destination: '', 
    message: 'Test SMS from TailoredHands. If you receive this, your SMS configuration is working correctly!' 
  });
  
  const [config, setConfig] = useState({
    service: 'Twilio',
    account_sid: '',
    auth_token: '',
    from_number: '',
    api_key: '',
    api_secret: '',
    username: '',
    sender_id: '',
    custom_api_url: '',
    auth_type: 'bearer'
  });

  const smsServices = [
    {
      name: 'Twilio',
      icon: MessageSquare,
      description: 'Global SMS service with excellent reliability and delivery rates',
      features: ['99.95% uptime', 'Global coverage', 'Detailed analytics', 'Easy integration']
    },
    {
      name: 'AfricasTalking',
      icon: MessageSquare,
      description: 'Leading SMS provider in Africa with great coverage in Ghana',
      features: ['Best for Africa', 'Local rates', 'Bulk SMS support', 'Good for Ghana']
    },
    {
      name: 'Vonage',
      icon: MessageSquare,
      description: 'Reliable SMS service with competitive pricing',
      features: ['Global reach', 'Competitive pricing', 'Good delivery rates', 'API-first']
    },
    {
      name: 'Termii',
      icon: MessageSquare,
      description: 'West African SMS provider with local expertise',
      features: ['West Africa focus', 'Local support', 'Good for Nigeria/Ghana', 'Affordable rates']
    },
    {
      name: 'Custom',
      icon: MessageSquare,
      description: 'Use your own SMS API endpoint',
      features: ['Full control', 'Custom integration', 'Any provider', 'Flexible setup']
    }
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // SMS config endpoint not yet implemented in backend
      console.log('📧 SMS config endpoint not yet implemented in backend');
      
      // Keep default config
    } catch (error) {
      console.error("Error loading SMS config:", error);
      toast({
        title: "Error",
        description: "Failed to load SMS configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleServiceSelect = (service) => {
    setConfig(prev => ({ ...prev, service }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields based on service
      if (config.service === 'Twilio' && (!config.account_sid || !config.auth_token || !config.from_number)) {
        throw new Error('Twilio Account SID, Auth Token, and From Number are required');
      }
      if (config.service === 'AfricasTalking' && (!config.api_key || !config.username)) {
        throw new Error('Africa\'s Talking API key and username are required');
      }
      if (config.service === 'Vonage' && (!config.api_key || !config.api_secret)) {
        throw new Error('Vonage API key and secret are required');
      }
      if (config.service === 'Termii' && !config.api_key) {
        throw new Error('Termii API key is required');
      }
      if (config.service === 'Custom' && (!config.custom_api_url || !config.api_key)) {
        throw new Error('Custom API URL and authentication are required');
      }

      // SMS config save endpoint not yet implemented in backend
      console.log('📧 SMS config save endpoint not yet implemented in backend');
      
      toast({
        title: "Feature Not Available",
        description: "SMS configuration save functionality is not yet implemented in the backend.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error saving SMS config:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save SMS configuration.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testSMSData.destination) {
      toast({
        title: "Validation Error",
        description: "Please enter a phone number.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      await testSMS(testSMSData);
      toast({
        title: "Test SMS Sent",
        description: `Test SMS sent successfully to ${testSMSData.destination}`,
        variant: "success"
      });
    } catch (error) {
      console.error("Test SMS error:", error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test SMS.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-800">SMS Configuration</h1>
          <p className="text-slate-600 mt-2">Configure your SMS service provider for automated notifications</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleTestSMS} 
            disabled={testing || !config.service}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Test SMS
              </>
            )}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Selection */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Choose SMS Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {smsServices.map((service) => (
              <SMSServiceCard
                key={service.name}
                service={service.name}
                isSelected={config.service === service.name}
                onSelect={handleServiceSelect}
                icon={service.icon}
                description={service.description}
                features={service.features}
              />
            ))}
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {config.service} Configuration
            </h3>

            <div className="space-y-6">
              {/* Twilio Configuration */}
              {config.service === 'Twilio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Account SID *
                      </label>
                      <input
                        type="text"
                        value={config.account_sid}
                        onChange={(e) => handleConfigChange('account_sid', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        From Number *
                      </label>
                      <input
                        type="text"
                        value={config.from_number}
                        onChange={(e) => handleConfigChange('from_number', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Auth Token *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.auth_token ? "text" : "password"}
                        value={config.auth_token}
                        onChange={(e) => handleConfigChange('auth_token', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your Twilio Auth Token"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('auth_token')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.auth_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Africa's Talking Configuration */}
              {config.service === 'AfricasTalking' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={config.username}
                        onChange={(e) => handleConfigChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your AT username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sender ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={config.sender_id}
                        onChange={(e) => handleConfigChange('sender_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="TailoredHands"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.api_key ? "text" : "password"}
                        value={config.api_key}
                        onChange={(e) => handleConfigChange('api_key', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your Africa's Talking API Key"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('api_key')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vonage Configuration */}
              {config.service === 'Vonage' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        API Key *
                      </label>
                      <input
                        type="text"
                        value={config.api_key}
                        onChange={(e) => handleConfigChange('api_key', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your Vonage API Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        From Number/Sender ID
                      </label>
                      <input
                        type="text"
                        value={config.from_number}
                        onChange={(e) => handleConfigChange('from_number', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="TailoredHands or +1234567890"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      API Secret *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.api_secret ? "text" : "password"}
                        value={config.api_secret}
                        onChange={(e) => handleConfigChange('api_secret', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your Vonage API Secret"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('api_secret')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.api_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Termii Configuration */}
              {config.service === 'Termii' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        API Key *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.api_key ? "text" : "password"}
                          value={config.api_key}
                          onChange={(e) => handleConfigChange('api_key', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Your Termii API Key"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('api_key')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sender ID
                      </label>
                      <input
                        type="text"
                        value={config.sender_id}
                        onChange={(e) => handleConfigChange('sender_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="TailoredHands"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Configuration */}
              {config.service === 'Custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      API URL *
                    </label>
                    <input
                      type="url"
                      value={config.custom_api_url}
                      onChange={(e) => handleConfigChange('custom_api_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="https://api.yourprovider.com/sms/send"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Authentication Type
                      </label>
                      <select
                        value={config.auth_type}
                        onChange={(e) => handleConfigChange('auth_type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="bearer">Bearer Token</option>
                        <option value="api-key">API Key Header</option>
                        <option value="custom">Custom Authorization</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        API Key/Token *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.api_key ? "text" : "password"}
                          value={config.api_key}
                          onChange={(e) => handleConfigChange('api_key', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Your API key or token"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('api_key')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test SMS Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 sticky top-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test SMS
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={testSMSData.destination}
                  onChange={(e) => setTestSMSData(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="+233123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={testSMSData.message}
                  onChange={(e) => setTestSMSData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <Button 
                onClick={handleTestSMS} 
                disabled={testing || !config.service || !testSMSData.destination}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </div>

            {/* Setup Instructions */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Quick Setup Guide
              </h4>
              {config.service === 'Twilio' && (
                <div className="text-sm text-green-800 space-y-1">
                  <p>1. Sign up at twilio.com</p>
                  <p>2. Get Account SID from Console</p>
                  <p>3. Get Auth Token from Console</p>
                  <p>4. Buy a phone number</p>
                </div>
              )}
              {config.service === 'AfricasTalking' && (
                <div className="text-sm text-green-800 space-y-1">
                  <p>1. Sign up at africastalking.com</p>
                  <p>2. Get API key from dashboard</p>
                  <p>3. Use your username</p>
                  <p>4. Great for Ghana/Africa!</p>
                </div>
              )}
              {config.service === 'Termii' && (
                <div className="text-sm text-green-800 space-y-1">
                  <p>1. Sign up at termii.com</p>
                  <p>2. Get API key from dashboard</p>
                  <p>3. Register sender ID</p>
                  <p>4. Good for West Africa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMS;
