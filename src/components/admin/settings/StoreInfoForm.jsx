
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const StoreInfoForm = ({ settings, handleChange }) => {
  return (
    <div className="border-b pb-6 mb-6">
      <h2 className="text-xl font-medium mb-4">Store Information</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="storeName">Store Name</Label>
          <Input
            id="storeName"
            name="storeName"
            type="text"
            value={settings.storeName}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={settings.email}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={settings.phone}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            value={settings.address}
            onChange={handleChange}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default StoreInfoForm;
