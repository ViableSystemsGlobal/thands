import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import adminApiClient from '@/lib/services/adminApiClient';
import { sendSMSViaBackend } from '@/lib/services/sms';
import { 
  Smartphone,
  Send, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Users,
  MessageSquare,
  History,
  Clock,
  UserCheck
} from 'lucide-react';

const SMS = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  // SMS message state (Step 1)
  const [smsMessage, setSmsMessage] = useState({
    message: '',
    source: 'T-Hands' // Default, will be loaded from settings
  });

  // Recipient selection state (Step 2)
  const [recipients, setRecipients] = useState({
    sendToAllCustomers: false,
    sendToSelected: false,
    selectedCustomerIds: [],
    manualPhones: ''
  });

  // SMS History
  const [smsHistory, setSmsHistory] = useState([]);

  // SMS Templates
  const smsTemplates = [
    {
      name: "Order Confirmation",
      message: "Thank you for your order! Your order #{{order_number}} has been confirmed. We'll notify you when it ships."
    },
    {
      name: "Shipping Update",
      message: "Great news! Your order #{{order_number}} has been shipped. Track your package: {{tracking_link}}"
    },
    {
      name: "Delivery Confirmation",
      message: "Your order #{{order_number}} has been delivered! Thank you for choosing TailoredHands."
    },
    {
      name: "Payment Reminder",
      message: "Reminder: Payment for order #{{order_number}} is pending. Complete your payment to avoid cancellation."
    },
    {
      name: "Promotional",
      message: "🎉 Special offer! Get 20% off your next order. Use code SAVE20. Valid until {{expiry_date}}"
    }
  ];

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadSMSHistory();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCustomers(),
        loadSMSSettings()
      ]);
    } catch (error) {
      console.error('Error loading SMS data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSMSSettings = async () => {
    try {
      const response = await adminApiClient.get('/sms/settings');
      const data = response.data || response;
      if (data.data?.deywuro_source) {
        setSmsMessage(prev => ({ ...prev, source: data.data.deywuro_source }));
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
      // Keep default 'T-Hands' if settings can't be loaded
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await adminApiClient.get('/customers');
      const data = response.data || response;
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadSMSHistory = () => {
    try {
      const savedHistory = localStorage.getItem('sms_history');
      if (savedHistory) {
        setSmsHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading SMS history:', error);
    }
  };

  const saveSMSHistory = (smsRecord) => {
    const newHistory = [smsRecord, ...smsHistory.slice(0, 49)]; // Keep last 50
    setSmsHistory(newHistory);
    localStorage.setItem('sms_history', JSON.stringify(newHistory));
  };

  // Step validation
  const canProceedToStep2 = () => {
    return smsMessage.message.trim() !== '';
  };

  const canProceedToStep3 = () => {
    if (recipients.sendToAllCustomers) return true;
    if (recipients.sendToSelected && recipients.selectedCustomerIds.length > 0) return true;
    if (recipients.manualPhones.trim() !== '') return true;
    return false;
  };

  const handleCustomerToggle = (customerId) => {
    setRecipients(prev => {
      const isSelected = prev.selectedCustomerIds.includes(customerId);
      return {
        ...prev,
        selectedCustomerIds: isSelected
          ? prev.selectedCustomerIds.filter(id => id !== customerId)
          : [...prev.selectedCustomerIds, customerId]
      };
    });
  };

  const selectAllCustomers = () => {
    setRecipients(prev => ({
      ...prev,
      selectedCustomerIds: customers.map(c => c.id)
    }));
  };

  const clearCustomerSelection = () => {
    setRecipients(prev => ({
      ...prev,
      selectedCustomerIds: []
    }));
  };

  const getTotalRecipients = () => {
    let total = 0;
    if (recipients.sendToAllCustomers) total += customers.length;
    if (recipients.sendToSelected) total += recipients.selectedCustomerIds.length;
    if (recipients.manualPhones.trim()) {
      total += recipients.manualPhones.split(',').filter(p => p.trim()).length;
    }
    return total;
  };

  const getRecipientPhones = () => {
    const phones = [];
    
    if (recipients.sendToAllCustomers) {
      customers.forEach(c => {
        if (c.phone) phones.push(c.phone);
      });
    }
    
    if (recipients.sendToSelected) {
      recipients.selectedCustomerIds.forEach(id => {
        const customer = customers.find(c => c.id === id);
        if (customer && customer.phone) phones.push(customer.phone);
      });
    }
    
    if (recipients.manualPhones.trim()) {
      recipients.manualPhones.split(',').forEach(phone => {
        const trimmed = phone.trim();
        if (trimmed) phones.push(trimmed);
      });
    }
    
    return phones;
  };

  const sendSMS = async () => {
    setSending(true);
    try {
      const recipientPhones = getRecipientPhones();
      
      if (recipientPhones.length === 0) {
        toast({
          title: "No Recipients",
          description: "Please select at least one recipient.",
          variant: "destructive",
        });
        return;
      }

      const destination = recipientPhones.join(',');
      
      const smsData = {
        destination,
        message: smsMessage.message,
        source: smsMessage.source
      };

      const result = await sendSMSViaBackend(smsData);

      if (result.success) {
        toast({
          title: "SMS Sent Successfully!",
          description: `SMS sent to ${recipientPhones.length} recipient(s).`,
          className: "bg-green-50 border-green-200 text-green-700",
        });

        // Save to history
        saveSMSHistory({
          id: Date.now(),
          destination,
          message: smsMessage.message,
          source: smsMessage.source,
          timestamp: new Date().toISOString(),
          status: 'sent',
          recipients: recipientPhones.length
        });

        // Reset form
        setCurrentStep(1);
        setSmsMessage({
          message: '',
          source: 'TailoredHands'
        });
        setRecipients({
          sendToAllCustomers: false,
          sendToSelected: false,
          selectedCustomerIds: [],
          manualPhones: ''
        });
        
        // Reload history
        loadSMSHistory();
      } else {
        throw new Error(result.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send SMS.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSmsMessage(prev => ({
      ...prev,
      message: template.message
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]">
        <Loader2 className="h-12 w-12 animate-spin text-[#D2B48C]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-gray-800 flex items-center">
          <Smartphone className="w-8 h-8 mr-3 text-[#D2B48C]" />
          Send SMS
        </h1>
        <p className="text-gray-500 mt-1">Simple step-by-step SMS sending</p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        currentStep === step
                          ? 'bg-[#D2B48C] text-white'
                          : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <div className={`text-sm font-medium ${currentStep >= step ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step === 1 ? 'Create Message' : step === 2 ? 'Select Recipients' : 'Review & Send'}
                      </div>
                    </div>
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Create Message */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        SMS Message
                      </CardTitle>
                      <CardDescription>Create your SMS message</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          value={smsMessage.message}
                          onChange={(e) => setSmsMessage(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your SMS message..."
                          rows={6}
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                          <span>Characters: {smsMessage.message.length}</span>
                          <span>Messages: {Math.ceil(smsMessage.message.length / 160)}</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="source">Sender ID</Label>
                        <Input
                          id="source"
                          value={smsMessage.source}
                          onChange={(e) => setSmsMessage(prev => ({ ...prev, source: e.target.value }))}
                          placeholder="T-Hands"
                          maxLength={11}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Maximum 11 characters. This will appear as the sender name.
                        </p>
                      </div>

                      {/* Templates */}
                      <div>
                        <Label className="mb-2 block">Quick Templates</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {smsTemplates.map((template, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{template.name}</span>
                                <Button size="sm" variant="ghost" className="h-7">
                                  Use
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          disabled={!canProceedToStep2()}
                          className="bg-[#D2B48C] hover:bg-[#C19A6B]"
                        >
                          Next: Select Recipients
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Preview
                      </CardTitle>
                      <CardDescription>How your SMS will look</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b">
                            <span className="text-xs font-medium text-gray-500">From: {smsMessage.source || 'TailoredHands'}</span>
                            <span className="text-xs text-gray-400">SMS</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {smsMessage.message || "Your message will appear here..."}
                          </p>
                          {smsMessage.message && (
                            <div className="mt-3 pt-2 border-t text-xs text-gray-400">
                              {smsMessage.message.length} characters • {Math.ceil(smsMessage.message.length / 160)} message{smsMessage.message.length > 160 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 2: Select Recipients */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Select Recipients
                    </CardTitle>
                    <CardDescription>Choose who will receive this SMS</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setRecipients(prev => ({ ...prev, sendToAllCustomers: !prev.sendToAllCustomers }))}
                      >
                        <Checkbox
                          checked={recipients.sendToAllCustomers}
                          onCheckedChange={(checked) => setRecipients(prev => ({ ...prev, sendToAllCustomers: checked }))}
                        />
                        <div>
                          <div className="font-medium">All Customers</div>
                          <div className="text-sm text-gray-500">{customers.filter(c => c.phone).length} with phone numbers</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setRecipients(prev => ({ ...prev, sendToSelected: !prev.sendToSelected }))}
                      >
                        <Checkbox
                          checked={recipients.sendToSelected}
                          onCheckedChange={(checked) => setRecipients(prev => ({ ...prev, sendToSelected: checked }))}
                        />
                        <div>
                          <div className="font-medium">Selected Customers</div>
                          <div className="text-sm text-gray-500">{recipients.selectedCustomerIds.length} selected</div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Customer Selection */}
                    {recipients.sendToSelected && (
                      <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <Label className="text-base font-semibold">Select Individual Customers</Label>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={selectAllCustomers}>
                              Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearCustomerSelection}>
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {customers.filter(c => c.phone).map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleCustomerToggle(customer.id)}
                            >
                              <Checkbox
                                checked={recipients.selectedCustomerIds.includes(customer.id)}
                                onCheckedChange={() => handleCustomerToggle(customer.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {customer.first_name} {customer.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{customer.phone}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual Phone Numbers */}
                    <div className="border-t pt-6">
                      <Label htmlFor="manualPhones">Or Enter Phone Numbers Manually</Label>
                      <Textarea
                        id="manualPhones"
                        value={recipients.manualPhones}
                        onChange={(e) => setRecipients(prev => ({ ...prev, manualPhones: e.target.value }))}
                        placeholder="Enter phone numbers separated by commas (e.g., 0241234567, 0247654321)"
                        rows={3}
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter Ghana phone numbers. Use format: 0241234567 or +233241234567
                      </p>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={!canProceedToStep3()}
                        className="bg-[#D2B48C] hover:bg-[#C19A6B]"
                      >
                        Next: Review & Send
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Review & Send */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Review & Send
                    </CardTitle>
                    <CardDescription>Review your SMS before sending</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* SMS Preview */}
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Message Preview</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b">
                            <span className="text-xs font-medium text-gray-500">From: {smsMessage.source}</span>
                            <span className="text-xs text-gray-400">SMS</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{smsMessage.message}</p>
                          <div className="mt-3 pt-2 border-t text-xs text-gray-400">
                            {smsMessage.message.length} characters • {Math.ceil(smsMessage.message.length / 160)} message{smsMessage.message.length > 160 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recipients Summary */}
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Recipients</Label>
                      <div className="space-y-2">
                        {recipients.sendToAllCustomers && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">All Customers</span>
                            <Badge>{customers.filter(c => c.phone).length}</Badge>
                          </div>
                        )}
                        {recipients.sendToSelected && recipients.selectedCustomerIds.length > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Selected Customers</span>
                            <Badge>{recipients.selectedCustomerIds.length}</Badge>
                          </div>
                        )}
                        {recipients.manualPhones.trim() && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Manual Phone Numbers</span>
                            <Badge>{recipients.manualPhones.split(',').filter(p => p.trim()).length}</Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-[#D2B48C] bg-opacity-10 rounded-lg border border-[#D2B48C]">
                          <span className="font-semibold">Total Recipients</span>
                          <Badge className="bg-[#D2B48C] text-white">{getTotalRecipients()}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={sendSMS}
                        disabled={sending}
                        className="bg-[#D2B48C] hover:bg-[#C19A6B]"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send SMS
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                SMS History
              </CardTitle>
              <CardDescription>
                View all SMS messages you've sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {smsHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No SMS messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smsHistory.map((sms) => (
                    <div key={sms.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Sent
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{sms.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{sms.recipients} recipient{sms.recipients !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(sms.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Smartphone className="w-4 h-4" />
                              <span>From: {sms.source}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMS;
