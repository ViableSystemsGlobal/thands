
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

const PaymentSettingsForm = ({ settings, handleChange }) => {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Payment Settings (Paystack)</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="paystackPublicKey">
            Public Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="paystackPublicKey"
            name="paystackPublicKey"
            type="text"
            value={settings.paystackPublicKey}
            onChange={handleChange}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="paystackSecretKey">
            Secret Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="paystackSecretKey"
            name="paystackSecretKey"
            type="password" 
            value={settings.paystackSecretKey}
            onChange={handleChange}
            className="mt-1"
            required
          />
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>
            Find your Paystack API keys in your{' '}
            <a
              href="https://dashboard.paystack.com/#/settings/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Paystack Dashboard
            </a>
            . Use Test Keys for development and Live Keys for production.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsForm;
