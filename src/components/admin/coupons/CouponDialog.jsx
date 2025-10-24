
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { addCouponDb, updateCouponDb } from '@/lib/db';
import CouponFormInputs from './CouponFormInputs';

const CouponDialog = ({ open, onOpenChange, coupon, onSave }) => {
  const { toast } = useToast();
  const initialFormData = {
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    valid_from: '',
    valid_until: '',
    usage_limit_per_coupon: '',
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (coupon) {
        setFormData({
          code: coupon.code || '',
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value || '',
          min_purchase_amount: coupon.min_purchase_amount || '',
          max_discount_amount: coupon.max_discount_amount || '',
          valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
          valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
          usage_limit_per_coupon: coupon.usage_limit_per_coupon || '',
          is_active: coupon.is_active !== undefined ? coupon.is_active : true,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [coupon, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToSave = {
      ...formData,
      discount_value: parseFloat(formData.discount_value) || 0,
      min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit_per_coupon: formData.usage_limit_per_coupon ? parseInt(formData.usage_limit_per_coupon, 10) : null,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
    };
    
    if (!dataToSave.code || dataToSave.code.trim() === "") {
        toast({ title: "Error", description: "Coupon code cannot be empty.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    if (dataToSave.discount_value <= 0) {
        toast({ title: "Error", description: "Discount value must be greater than 0.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      if (coupon && coupon.id) {
        await updateCouponDb(coupon.id, dataToSave);
        toast({ title: 'Success', description: 'Coupon updated successfully.' });
      } else {
        await addCouponDb(dataToSave);
        toast({ title: 'Success', description: 'Coupon added successfully.' });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${coupon ? 'update' : 'add'} coupon. ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {coupon ? 'Edit Coupon' : 'Add New Coupon'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Fill in the details for the coupon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-6 px-2 max-h-[70vh] overflow-y-auto">
          <CouponFormInputs
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            isLoading={isLoading}
          />
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? 'Saving...' : (coupon ? 'Save Changes' : 'Add Coupon')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponDialog;
