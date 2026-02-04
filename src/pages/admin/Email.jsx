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
import { emailApi } from '@/lib/services/emailApi';
import EmailTemplate from '@/components/EmailTemplate';
import { 
  Send, 
  Users, 
  Mail, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Plus,
  X,
  ShoppingBag,
  Eye,
  FileText,
  History,
  Clock
} from 'lucide-react';

const Email = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // Email history state
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  
  // Email template state (Step 1)
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '',
    content: '',
    buttonText: '',
    buttonUrl: '',
  });

  // Recipient selection state (Step 2)
  const [recipients, setRecipients] = useState({
    sendToAllCustomers: false,
    sendToNewsletter: false,
    sendToSelected: false,
    selectedCustomerIds: []
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadProducts();
    loadEmailHistory();
  }, [historyPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCustomers(),
        loadNewsletterSubscribers()
      ]);
    } catch (error) {
      console.error('Error loading email data:', error);
      toast({
        title: "Error",
        description: "Failed to load email data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const loadNewsletterSubscribers = async () => {
    try {
      const response = await adminApiClient.get('/newsletter/subscribers?page=1&limit=1000');
      const data = response.data || response;
      setNewsletterSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Error loading newsletter subscribers:', error);
      setNewsletterSubscribers([]);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await adminApiClient.get('/products?limit=50');
      const data = response.data || response;
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadEmailHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await emailApi.getEmailLogs(historyPage, 20);
      const data = response.data || response;
      setEmailHistory(data.logs || []);
      setHistoryTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading email history:', error);
      setEmailHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Generate HTML content from template
  const generateEmailHTML = () => {
    const companyName = "Tailored Hands";
    const companyEmail = "contact@tailoredhands.africa";
    const companyPhone = "+233 XX XXX XXXX";
    const companyAddress = "123 Business Street, Accra, Ghana";
    const websiteUrl = "https://tailoredhands.africa";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailTemplate.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { background-color: #D2B48C; color: white; padding: 20px; text-align: center; }
        .email-body { padding: 30px; }
        .email-footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
        .button { display: inline-block; background-color: #D2B48C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${companyName}</h1>
            <p>Modern Elegance Redefined</p>
        </div>
        <div class="email-body">
            <h2>${emailTemplate.subject}</h2>
            <div>${emailTemplate.content.replace(/\n/g, '<br>')}</div>
            ${selectedProducts.length > 0 ? generateProductsHTML(websiteUrl) : ''}
            ${emailTemplate.buttonText && emailTemplate.buttonUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${emailTemplate.buttonUrl}" class="button">${emailTemplate.buttonText}</a></div>` : ''}
        </div>
        <div class="email-footer">
            <div><a href="${websiteUrl}" style="color: #D2B48C; text-decoration: none; margin: 0 10px;">Visit Our Website</a></div>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            <p><strong>Contact:</strong><br/>Email: ${companyEmail}<br/>Phone: ${companyPhone}<br/>Address: ${companyAddress}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const generateProductsHTML = (websiteUrl) => {
    return `
    <div style="margin: 30px 0;">
        <h3 style="color: #D2B48C; margin-bottom: 20px; text-align: center;">Featured Products</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
            <tbody>
                ${selectedProducts.map((product, index) => {
                  const isEven = index % 2 === 0;
                  const isLastRow = index >= selectedProducts.length - (selectedProducts.length % 2 === 0 ? 2 : 1);
                  
                  if (isEven) {
                    return `
                        <tr>
                            <td style="width: 50%; padding: 10px; vertical-align: top; border: none;">
                                <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff; margin-bottom: ${isLastRow ? '0' : '20px'};">
                                    ${product.image_url ? `<div style="width: 100%; height: 150px; overflow: hidden;"><img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
                                    <div style="padding: 15px;">
                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${product.name}</h4>
                                        ${product.description ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #666; line-height: 1.4;">${product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}</p>` : ''}
                                        ${product.price ? `<div style="font-size: 18px; font-weight: bold; color: #D2B48C; margin-bottom: 10px;">$${product.price}</div>` : ''}
                                        <a href="${websiteUrl}/products/${product.slug || product.id}" style="display: inline-block; background-color: #D2B48C; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">View Product</a>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 50%; padding: 10px; vertical-align: top; border: none;">
                                ${selectedProducts[index + 1] ? `
                                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff; margin-bottom: ${isLastRow ? '0' : '20px'};">
                                        ${selectedProducts[index + 1].image_url ? `<div style="width: 100%; height: 150px; overflow: hidden;"><img src="${selectedProducts[index + 1].image_url}" alt="${selectedProducts[index + 1].name}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
                                        <div style="padding: 15px;">
                                            <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${selectedProducts[index + 1].name}</h4>
                                            ${selectedProducts[index + 1].description ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #666; line-height: 1.4;">${selectedProducts[index + 1].description.length > 100 ? selectedProducts[index + 1].description.substring(0, 100) + '...' : selectedProducts[index + 1].description}</p>` : ''}
                                            ${selectedProducts[index + 1].price ? `<div style="font-size: 18px; font-weight: bold; color: #D2B48C; margin-bottom: 10px;">$${selectedProducts[index + 1].price}</div>` : ''}
                                            <a href="${websiteUrl}/products/${selectedProducts[index + 1].slug || selectedProducts[index + 1].id}" style="display: inline-block; background-color: #D2B48C; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">View Product</a>
                                        </div>
                                    </div>
                                ` : '<div></div>'}
                            </td>
                        </tr>
                    `;
                  }
                  return '';
                }).join('')}
            </tbody>
        </table>
    </div>
    `;
  };

  // Step validation
  const canProceedToStep2 = () => {
    return emailTemplate.subject.trim() !== '' && emailTemplate.content.trim() !== '';
  };

  const canProceedToStep3 = () => {
    return recipients.sendToAllCustomers || 
           recipients.sendToNewsletter || 
           (recipients.sendToSelected && recipients.selectedCustomerIds.length > 0);
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
    if (recipients.sendToNewsletter) total += newsletterSubscribers.length;
    if (recipients.sendToSelected) total += recipients.selectedCustomerIds.length;
    return total;
  };

  const sendEmail = async () => {
    setSending(true);
    try {
      const htmlContent = generateEmailHTML();
      
      const payload = {
        subject: emailTemplate.subject,
        content: htmlContent,
        send_to_all_customers: recipients.sendToAllCustomers,
        send_to_newsletter: recipients.sendToNewsletter,
        send_to_selected: recipients.sendToSelected,
        selected_customers: recipients.selectedCustomerIds
      };

      await adminApiClient.post('/email/send', payload);
      
      toast({
        title: "Email Sent Successfully!",
        description: `Email sent to ${getTotalRecipients()} recipient(s).`,
        className: "bg-green-50 border-green-200 text-green-700",
      });

      // Reset form
      setCurrentStep(1);
      setEmailTemplate({
        subject: '',
        content: '',
        buttonText: '',
        buttonUrl: '',
      });
      setRecipients({
        sendToAllCustomers: false,
        sendToNewsletter: false,
        sendToSelected: false,
        selectedCustomerIds: []
      });
      setSelectedProducts([]);
      
      // Reload history
      loadEmailHistory();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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
          <Send className="w-8 h-8 mr-3 text-[#D2B48C]" />
          Send Email
        </h1>
        <p className="text-gray-500 mt-1">Simple step-by-step email sending</p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Email
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
                    {step === 1 ? 'Create Email' : step === 2 ? 'Select Recipients' : 'Review & Send'}
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
          {/* Step 1: Create Email */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Email Content
                  </CardTitle>
                  <CardDescription>Create your email subject and message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={emailTemplate.subject}
                      onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Message *</Label>
                    <Textarea
                      id="content"
                      value={emailTemplate.content}
                      onChange={(e) => setEmailTemplate(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your email message..."
                      rows={8}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buttonText">Button Text (optional)</Label>
                      <Input
                        id="buttonText"
                        value={emailTemplate.buttonText}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, buttonText: e.target.value }))}
                        placeholder="e.g., Shop Now"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buttonUrl">Button Link (optional)</Label>
                      <Input
                        id="buttonUrl"
                        value={emailTemplate.buttonUrl}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, buttonUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Featured Products (optional)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductSelector(!showProductSelector)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Products
                      </Button>
                    </div>
                    
                    {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedProducts.map((product) => (
                          <Badge key={product.id} variant="secondary" className="flex items-center space-x-2">
                            <ShoppingBag className="h-3 w-3" />
                            <span>{product.name}</span>
                            <button
                              onClick={() => setSelectedProducts(prev => prev.filter(p => p.id !== product.id))}
                              className="ml-1 hover:bg-red-100 rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {showProductSelector && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Select Products</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowProductSelector(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {loadingProducts ? (
                          <div className="text-center py-4">Loading products...</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  if (!selectedProducts.find(p => p.id === product.id)) {
                                    setSelectedProducts(prev => [...prev, product]);
                                  }
                                }}
                              >
                                {product.image_url && (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{product.name}</p>
                                  {product.price && (
                                    <p className="text-xs text-gray-500">${product.price}</p>
                                  )}
                                </div>
                                {selectedProducts.find(p => p.id === product.id) && (
                                  <Badge variant="default" className="text-xs">Added</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
                    <Eye className="w-5 h-5" />
                    Preview
                  </CardTitle>
                  <CardDescription>How your email will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '600px', overflowY: 'auto' }}>
                    <EmailTemplate
                      subject={emailTemplate.subject || "Email Subject"}
                      content={emailTemplate.content || "Your email content will appear here..."}
                      buttonText={emailTemplate.buttonText}
                      buttonUrl={emailTemplate.buttonUrl}
                      products={selectedProducts}
                    />
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
                <CardDescription>Choose who will receive this email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setRecipients(prev => ({ ...prev, sendToAllCustomers: !prev.sendToAllCustomers }))}
                  >
                    <Checkbox
                      checked={recipients.sendToAllCustomers}
                      onCheckedChange={(checked) => setRecipients(prev => ({ ...prev, sendToAllCustomers: checked }))}
                    />
                    <div>
                      <div className="font-medium">All Customers</div>
                      <div className="text-sm text-gray-500">{customers.length} recipients</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setRecipients(prev => ({ ...prev, sendToNewsletter: !prev.sendToNewsletter }))}
                  >
                    <Checkbox
                      checked={recipients.sendToNewsletter}
                      onCheckedChange={(checked) => setRecipients(prev => ({ ...prev, sendToNewsletter: checked }))}
                    />
                    <div>
                      <div className="font-medium">Newsletter Subscribers</div>
                      <div className="text-sm text-gray-500">{newsletterSubscribers.length} recipients</div>
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
                      {customers.map((customer) => (
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
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                <CardDescription>Review your email before sending</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Preview */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Email Preview</Label>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                    <EmailTemplate
                      subject={emailTemplate.subject}
                      content={emailTemplate.content}
                      buttonText={emailTemplate.buttonText}
                      buttonUrl={emailTemplate.buttonUrl}
                      products={selectedProducts}
                    />
                  </div>
                </div>

                {/* Recipients Summary */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Recipients</Label>
                  <div className="space-y-2">
                    {recipients.sendToAllCustomers && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">All Customers</span>
                        <Badge>{customers.length}</Badge>
                      </div>
                    )}
                    {recipients.sendToNewsletter && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Newsletter Subscribers</span>
                        <Badge>{newsletterSubscribers.length}</Badge>
                      </div>
                    )}
                    {recipients.sendToSelected && recipients.selectedCustomerIds.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Selected Customers</span>
                        <Badge>{recipients.selectedCustomerIds.length}</Badge>
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
                    onClick={sendEmail}
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
                        Send Email
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
                Email History
              </CardTitle>
              <CardDescription>
                View all emails you've sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D2B48C]" />
                </div>
              ) : emailHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No emails sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailHistory.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold text-gray-800">{log.subject}</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Sent
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{log.recipient_count} recipient{log.recipient_count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(log.sent_at).toLocaleString()}</span>
                            </div>
                            {log.sent_by_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>By: {log.sent_by_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {historyTotal > 20 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {((historyPage - 1) * 20) + 1} to {Math.min(historyPage * 20, historyTotal)} of {historyTotal} emails
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                          disabled={historyPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => prev + 1)}
                          disabled={historyPage * 20 >= historyTotal}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Email;
