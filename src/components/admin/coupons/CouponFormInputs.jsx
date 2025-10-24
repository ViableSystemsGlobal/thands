
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CouponFormInputs = ({ formData, handleChange, handleSelectChange, isLoading }) => {
  return (
    <>
      <div>
        <Label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coupon Code</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      <div>
        <Label htmlFor="discount_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Type</Label>
        <Select
          name="discount_type"
          value={formData.discount_type}
          onValueChange={(value) => handleSelectChange('discount_type', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full mt-1 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50">
            <SelectValue placeholder="Select discount type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50">
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="discount_value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Value</Label>
        <Input
          id="discount_value"
          name="discount_value"
          type="number"
          value={formData.discount_value}
          onChange={handleChange}
          required
          min="0.01"
          step="0.01"
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      <div>
        <Label htmlFor="min_purchase_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Minimum Purchase Amount (Optional)</Label>
        <Input
          id="min_purchase_amount"
          name="min_purchase_amount"
          type="number"
          value={formData.min_purchase_amount}
          onChange={handleChange}
          min="0"
          step="0.01"
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      {formData.discount_type === 'percentage' && (
        <div>
          <Label htmlFor="max_discount_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maximum Discount Amount (Optional, for Percentage)</Label>
          <Input
            id="max_discount_amount"
            name="max_discount_amount"
            type="number"
            value={formData.max_discount_amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            disabled={isLoading}
            className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          />
        </div>
      )}

      <div>
        <Label htmlFor="valid_from" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valid From (Optional)</Label>
        <Input
          id="valid_from"
          name="valid_from"
          type="datetime-local"
          value={formData.valid_from}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      <div>
        <Label htmlFor="valid_until" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valid Until (Optional)</Label>
        <Input
          id="valid_until"
          name="valid_until"
          type="datetime-local"
          value={formData.valid_until}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      <div>
        <Label htmlFor="usage_limit_per_coupon" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usage Limit (Optional)</Label>
        <Input
          id="usage_limit_per_coupon"
          name="usage_limit_per_coupon"
          type="number"
          value={formData.usage_limit_per_coupon}
          onChange={handleChange}
          min="1"
          step="1"
          disabled={isLoading}
          className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleSelectChange('is_active', checked)}
          disabled={isLoading}
          className="h-5 w-5 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800"
        />
        <Label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Active
        </Label>
      </div>
    </>
  );
};

export default CouponFormInputs;
