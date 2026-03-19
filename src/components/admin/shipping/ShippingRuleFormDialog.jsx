import React, { useState, useEffect, useMemo } from "react";
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
import { countries } from "@/lib/location-data";
import { cn } from "@/lib/utils";
import { Loader2, Search, Check, X } from "lucide-react";

const initialFormData = {
  name: "",
  countries: [],
  state: "",
  min_amount: "",
  max_amount: "",
  shipping_fee: "",
  per_kg_rate: "",
  delivery_time: "",
  carrier: "",
  is_active: true,
  suppress_dhl: false,
};

// Simple inline country selector component
const CountrySelector = ({ selected, onChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    return countries.filter(country =>
      country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleCountry = (country) => {
    const newSelected = selected.includes(country)
      ? selected.filter(c => c !== country)
      : [...selected, country];
    onChange(newSelected);
  };

  const selectAll = () => {
    onChange([...countries]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="border rounded-md bg-white">
      {/* Selected Countries Display */}
      {selected.length > 0 && (
        <div className="p-2 border-b bg-gray-50 flex flex-wrap gap-1">
          {selected.slice(0, 3).map(country => (
            <span 
              key={country} 
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {country}
              <button
                type="button"
                onClick={() => toggleCountry(country)}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
              +{selected.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 text-left text-sm flex items-center justify-between hover:bg-gray-50"
      >
        <span className="text-gray-600">
          {selected.length === 0 
            ? "Click to select countries (leave empty for international)" 
            : `${selected.length} country(ies) selected`}
        </span>
        <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded Country List */}
      {isExpanded && (
        <div className="border-t">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Select All / Clear All */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Country List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight: '200px' }}
          >
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map(country => (
                <label
                  key={country}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(country)}
                    onChange={() => toggleCountry(country)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{country}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
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
        per_kg_rate: initialData.per_kg_rate?.toString() || "",
        delivery_time: initialData.delivery_time || "",
        carrier: initialData.carrier || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        suppress_dhl: initialData.suppress_dhl || false,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Label className="font-medium text-gray-700">Countries</Label>
            <div className="mt-1">
              <CountrySelector
                selected={formData.countries}
                onChange={handleCountriesChange}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="per_kg_rate" className="font-medium text-gray-700">Rate per Kg (USD)</Label>
              <Input
                id="per_kg_rate"
                name="per_kg_rate"
                type="number"
                step="0.01"
                value={formData.per_kg_rate}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Price per kilogram of weight
              </p>
            </div>
            <div>
              <Label htmlFor="shipping_fee" className="font-medium text-gray-700">Base Fee (USD)</Label>
              <Input
                id="shipping_fee"
                name="shipping_fee"
                type="number"
                step="0.01"
                value={formData.shipping_fee}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fallback if no per-kg rate
              </p>
              {formErrors.shipping_fee && <p className="text-xs text-red-500 mt-1">{formErrors.shipping_fee}</p>}
            </div>
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

          <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <input
              type="checkbox"
              id="suppress_dhl"
              name="suppress_dhl"
              checked={formData.suppress_dhl}
              onChange={handleInputChange}
              className="rounded mt-0.5"
            />
            <div>
              <Label htmlFor="suppress_dhl" className="font-medium text-gray-700 cursor-pointer">
                Suppress DHL for this region
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, DHL rates will not be shown for destinations matching this rule's country/state. Only this manual rate will appear.
              </p>
            </div>
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
