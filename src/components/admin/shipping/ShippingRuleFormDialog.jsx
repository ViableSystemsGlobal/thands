import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { countries } from "@/lib/location-data";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const initialFormData = {
  name: "",
  countries: [],
  state: "",
  min_amount: "",
  max_amount: "",
  shipping_fee: "",
  delivery_time: "",
  carrier: "",
  is_active: true,
};

const ShippingRuleFormDialog = ({ isOpen, onOpenChange, onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState(initialData || initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        countries: initialData.countries || [],
        state: initialData.state || "",
        min_amount: initialData.min_amount?.toString() || "",
        max_amount: initialData.max_amount?.toString() || "",
        shipping_fee: initialData.shipping_fee?.toString() || "",
        delivery_time: initialData.delivery_time || "",
        carrier: initialData.carrier || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData(initialFormData);
    }
    setFormErrors({});
  }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCountriesChange = (selectedCountries) => {
    setFormData((prev) => ({ ...prev, countries: selectedCountries }));
    if (formErrors.countries) {
      setFormErrors((prev) => ({ ...prev, countries: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Rule name is required.";
    if (!formData.shipping_fee || parseFloat(formData.shipping_fee) < 0) {
      errors.shipping_fee = "A valid shipping fee is required.";
    }
    if (
      formData.min_amount &&
      formData.max_amount &&
      parseFloat(formData.min_amount) > parseFloat(formData.max_amount)
    ) {
      errors.max_amount = "Maximum amount must be greater than or equal to minimum amount.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsSubmitting(true);
    const success = await onSubmit(formData, isEditing);
    setIsSubmitting(false);
    if (success) {
      handleDialogClose();
    }
  };
  
  const handleDialogClose = () => {
    setFormData(initialFormData);
    setFormErrors({});
    if (onClose) onClose();
    onOpenChange(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shipping Rule" : "Add Shipping Rule"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the shipping rule details." : "Create a new shipping rule for your store."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="font-medium text-gray-700">Rule Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Ghana Standard Shipping"
              className="mt-1"
              required
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="countries" className="font-medium text-gray-700">Countries</Label>
            <div className="mt-1">
              <MultiSelect
                items={countries}
                selected={formData.countries}
                onChange={handleCountriesChange}
                placeholder="Select countries (leave empty for international)"
                searchPlaceholder="Search countries..."
              />
            </div>
            {formErrors.countries && <p className="text-xs text-red-500 mt-1">{formErrors.countries}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for international shipping rule that applies to all countries not covered by specific rules
            </p>
          </div>

          <div>
            <Label htmlFor="state" className="font-medium text-gray-700">State/Region (Optional)</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="e.g., California, Greater Accra"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_amount" className="font-medium text-gray-700">Min Order Amount</Label>
              <Input
                id="min_amount"
                name="min_amount"
                type="number"
                step="0.01"
                value={formData.min_amount}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max_amount" className="font-medium text-gray-700">Max Order Amount</Label>
              <Input
                id="max_amount"
                name="max_amount"
                type="number"
                step="0.01"
                value={formData.max_amount}
                onChange={handleInputChange}
                placeholder="No limit"
                className="mt-1"
              />
              {formErrors.max_amount && <p className="text-xs text-red-500 mt-1">{formErrors.max_amount}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="shipping_fee" className="font-medium text-gray-700">Shipping Fee (USD)</Label>
            <Input
              id="shipping_fee"
              name="shipping_fee"
              type="number"
              step="0.01"
              value={formData.shipping_fee}
              onChange={handleInputChange}
              placeholder="0.00"
              className="mt-1"
              required
            />
            {formErrors.shipping_fee && <p className="text-xs text-red-500 mt-1">{formErrors.shipping_fee}</p>}
          </div>

          <div>
            <Label htmlFor="delivery_time" className="font-medium text-gray-700">Delivery Time (Optional)</Label>
            <Input
              id="delivery_time"
              name="delivery_time"
              value={formData.delivery_time}
              onChange={handleInputChange}
              placeholder="e.g., 3-5 business days"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="carrier" className="font-medium text-gray-700">Carrier (Optional)</Label>
            <Input
              id="carrier"
              name="carrier"
              value={formData.carrier}
              onChange={handleInputChange}
              placeholder="e.g., DHL, FedEx, Local Courier"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded"
            />
            <Label htmlFor="is_active" className="font-medium text-gray-700">Active</Label>
          </div>
        </form>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Rule" : "Create Rule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingRuleFormDialog;
