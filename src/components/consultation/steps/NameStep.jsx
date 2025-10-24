
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const NameStep = ({ formData, setFormData, currentStep, validateStep }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name-input" className="text-lg font-medium">What's your full name?</Label>
        <Input
          id="name-input"
          type="text"
          placeholder="e.g., Jane Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="text-lg p-4 border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>
      {currentStep === 0 && !validateStep(0, formData) && formData.name !== "" && (
        <p className="text-sm text-red-500">Full name cannot be empty.</p>
      )}
    </div>
  );
};

export default NameStep;
