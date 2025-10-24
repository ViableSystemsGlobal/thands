
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const RegionalSettingsForm = ({ settings, handleChange, handleSelectChange }) => {
  return (
    <div className="border-b pb-6 mb-6">
      <h2 className="text-xl font-medium mb-4">Regional Settings</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            name="currency"
            value={settings.currency}
            onValueChange={(value) => handleSelectChange('currency', value)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GHS">GHS</SelectItem>
              <SelectItem value="NGN">NGN</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="exchangeRateGHS">GHS Exchange Rate (to USD)</Label>
          <Input
            id="exchangeRateGHS"
            name="exchangeRateGHS"
            type="number"
            value={settings.exchangeRateGHS}
            onChange={handleChange}
            className="mt-1"
            step="0.01"
            min="0"
          />
          <p className="text-sm text-gray-500 mt-1">
            1 USD = {settings.exchangeRateGHS || 'N/A'} GHS
          </p>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
           <Select
            name="timezone"
            value={settings.timezone}
            onValueChange={(value) => handleSelectChange('timezone', value)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (ET)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default RegionalSettingsForm;
