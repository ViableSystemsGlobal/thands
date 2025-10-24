import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Database, CheckCircle, AlertCircle, Settings, ExternalLink, Copy } from 'lucide-react';
// Payment setup functionality temporarily disabled - backend endpoints not yet implemented

const PaymentSetup = () => {
  const [paymentConfig, setPaymentConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState({
    paymentConfig: false,
    databaseSetup: false,
    testPayment: false
  });
  const { toast } = useToast();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    setLoading(true);
    try {
      // Payment setup status check endpoints not yet implemented in backend
      console.log('📧 Payment setup status endpoints not yet implemented in backend');
      
      setSetupStatus({
        paymentConfig: false,
        databaseSetup: false,
        testPayment: false
      });

    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "SQL command copied to clipboard",
      variant: "success"
    });
  };

  const databaseSetupSQL = `-- Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(20) NOT NULL,
  gateway VARCHAR(50) DEFAULT 'paystack',
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_number ON payment_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference ON payment_logs(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Enable RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;`;

  const setupSteps = [
    {
      id: 'paymentConfig',
      title: 'Configure Paystack Keys',
      description: 'Set up your Paystack public and secret keys',
      status: setupStatus.paymentConfig,
      action: () => window.location.href = '/admin/settings',
      actionText: 'Configure Keys'
    },
    {
      id: 'databaseSetup',
      title: 'Database Setup',
      description: 'Create payment tables and indexes',
      status: setupStatus.databaseSetup,
      action: () => console.log('Database setup not yet implemented'),
      actionText: 'Open Supabase'
    },
    {
      id: 'testPayment',
      title: 'Test Payment',
      description: 'Verify payment integration works',
      status: setupStatus.testPayment,
      action: () => window.open('/shop', '_blank'),
      actionText: 'Test Now'
    }
  ];

  const getStatusIcon = (status) => {
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status) => {
    return status ? 
      <Badge variant="success" className="bg-green-100 text-green-800">Complete</Badge> : 
      <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const overallProgress = Object.values(setupStatus).filter(Boolean).length;
  const totalSteps = Object.keys(setupStatus).length;

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="text-center">Loading setup status...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Payment Integration Setup
          </h1>
          <p className="text-gray-600">
            Complete Paystack payment integration for your Tailored Hands store
          </p>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2 w-full max-w-md mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(overallProgress / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {overallProgress} of {totalSteps} steps complete
            </p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="grid gap-6">
          {setupSteps.map((step, index) => (
            <Card key={step.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {step.title}
                        {getStatusIcon(step.status)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(step.status)}
                    {!step.status && (
                      <Button 
                        onClick={step.action}
                        size="sm"
                        variant="outline"
                      >
                        {step.actionText}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Database Setup Instructions */}
              {step.id === 'databaseSetup' && !step.status && (
                <CardContent>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      SQL Setup Required
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Run this SQL in your Supabase SQL Editor to create the payment_logs table:
                    </p>
                    
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {databaseSetupSQL}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(databaseSetupSQL)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => console.log('Database setup not yet implemented')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Open Supabase Dashboard
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={checkSetupStatus}
                      >
                        Recheck Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Configuration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Paystack Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Public Key:</span>
                    <span className="text-gray-500">
                      {paymentConfig.paystack_public_key ? 
                        `${paymentConfig.paystack_public_key.substring(0, 10)}...` : 
                        'Not configured'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Secret Key:</span>
                    <span className="text-gray-500">
                      {paymentConfig.paystack_secret_key ? 
                        `${paymentConfig.paystack_secret_key.substring(0, 10)}...` : 
                        'Not configured'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Integration Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Payment Gateway:</span>
                    <Badge variant="outline">Paystack</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Currency:</span>
                    <Badge variant="outline">GHS</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Mode:</span>
                    <Badge variant="outline">
                      {paymentConfig.paystack_public_key?.startsWith('pk_test_') ? 'Test' : 'Live'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Payment Instructions */}
        {overallProgress === totalSteps && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Setup Complete! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-green-700 space-y-2">
                <p>Your payment integration is ready! Here's how to test:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to your shop and add products to cart</li>
                  <li>Proceed to checkout and fill in details</li>
                  <li>Use test card: <code className="bg-white px-1 rounded">4084084084084081</code></li>
                  <li>CVV: <code className="bg-white px-1 rounded">408</code>, Expiry: Any future date</li>
                  <li>Complete payment and verify order status</li>
                </ol>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => window.open('/shop', '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Test Payment Flow
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => window.open('https://dashboard.paystack.com', '_blank')}
                    variant="outline"
                  >
                    View Paystack Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Documentation</h4>
                <p className="text-gray-600 mb-2">Check the PAYMENT_SETUP.md file for detailed instructions.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Test Cards</h4>
                <p className="text-gray-600 mb-2">Use Paystack test cards for safe testing without real money.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Support</h4>
                <p className="text-gray-600 mb-2">Check browser console for errors during testing.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSetup; 