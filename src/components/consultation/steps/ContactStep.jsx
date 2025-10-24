
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ContactStep = ({ formData, setFormData, currentStep, validateStep }) => {
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const showEmailError = currentStep === 1 && formData.email !== "" && !isEmailValid;
  const showRequiredFieldsError = currentStep === 1 && 
    (formData.email !== "" || formData.phone !== "" || formData.whatsappPhone !== "") && 
    (!formData.email || !formData.phone || !formData.whatsappPhone || !isEmailValid);


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email-input" className="text-lg font-medium">What's your email address?</Label>
        <Input
          id="email-input"
          type="email"
          placeholder="e.g., jane.doe@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="text-lg p-4 border-gray-300 focus:border-primary focus:ring-primary"
        />
        {showEmailError && (
           <p className="text-sm text-red-500">Please enter a valid email address.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone-input" className="text-lg font-medium">Your phone number (for calls)</Label>
        <Input
          id="phone-input"
          type="tel"
          placeholder="e.g., +1 234 567 8900"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="text-lg p-4 border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsapp-phone-input" className="text-lg font-medium">Your WhatsApp number (if different)</Label>
        <Input
          id="whatsapp-phone-input"
          type="tel"
          placeholder="e.g., +1 234 567 8901 (optional)"
          value={formData.whatsappPhone}
          onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
          className="text-lg p-4 border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>
      {showRequiredFieldsError && (
        <p className="text-sm text-red-500">Valid email, call phone, and WhatsApp phone are required.</p>
      )}
    </div>
  );
};

export default ContactStep;
