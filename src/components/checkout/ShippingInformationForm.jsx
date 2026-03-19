import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryCombobox } from "@/components/shop/CountryCombobox";
import { countries } from "@/lib/location-data";
import { History, Upload, X, Loader2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShippoShippingOptions from "./ShippoShippingOptions";
import GoogleAddressAutocomplete from "./GoogleAddressAutocomplete";
import { API_BASE_URL } from "@/lib/services/api";

const ShippingInformationForm = ({
  formData,
  handleInputChange,
  formErrors,
  user,
  previousAddresses,
  setSelectedAddress,
  createAccount,
  setCreateAccount,
  password,
  setPassword,
  shippingRules,
  cartItems,
  onShippingSelected,
  selectedShipping
}) => {
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(formData.customerPhotoUrl || null);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/order-photo`, {
        method: 'POST',
        body: formPayload,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setPhotoPreview(data.url);
      handleInputChange({ target: { name: 'customerPhotoUrl', value: data.url } });
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    handleInputChange({ target: { name: 'customerPhotoUrl', value: '' } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-full bg-[#D2B48C] flex items-center justify-center">
          <History className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-xl font-medium">Shipping Information</h2>
      </div>

      {user && previousAddresses && previousAddresses.length > 0 && (
        <div className="mb-6">
          <Label>Use a Previous Address</Label>
          <div className="mt-2 space-y-2">
            {previousAddresses.map((address, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedAddress(address)}
                className="flex items-center gap-2 w-full p-3 text-left text-sm hover:bg-gray-100 rounded-md border"
              >
                <History className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{address.address}, {address.city}, {address.country}</span>
              </button>
            ))}
             <button
              type="button"
              onClick={() => setSelectedAddress(null)} 
              className="flex items-center gap-2 w-full p-3 text-left text-sm hover:bg-gray-100 rounded-md border text-blue-600"
            >
              Enter a new address
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={formErrors.firstName ? "border-red-500" : ""}
          />
          {formErrors.firstName && (
            <p className="text-sm text-red-500">{formErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={formErrors.lastName ? "border-red-500" : ""}
          />
          {formErrors.lastName && (
            <p className="text-sm text-red-500">{formErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          className={formErrors.email ? "border-red-500" : ""}
        />
        {formErrors.email && (
          <p className="text-sm text-red-500">{formErrors.email}</p>
        )}
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className={formErrors.phone ? "border-red-500" : ""}
        />
        {formErrors.phone && (
          <p className="text-sm text-red-500">{formErrors.phone}</p>
        )}
      </div>

      <div className="space-y-2 mt-4">
        <GoogleAddressAutocomplete
          value={formData.address}
          onChange={(value) => handleInputChange({ target: { name: 'address', value } })}
          onAddressSelect={(addressData) => {
            // Auto-fill form fields with parsed address data
            handleInputChange({ target: { name: 'address', value: addressData.address } });
            if (addressData.city) {
              handleInputChange({ target: { name: 'city', value: addressData.city } });
            }
            if (addressData.state) {
              handleInputChange({ target: { name: 'state', value: addressData.state } });
            }
            if (addressData.zip) {
              handleInputChange({ target: { name: 'postalCode', value: addressData.zip } });
            }
            if (addressData.country) {
              handleInputChange({ target: { name: 'country', value: addressData.country } });
            }
          }}
          placeholder="Enter your address"
          label="Address"
          required={true}
        />
        {formErrors.address && (
          <p className="text-sm text-red-500">{formErrors.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={formErrors.city ? "border-red-500" : ""}
          />
          {formErrors.city && (
            <p className="text-sm text-red-500">{formErrors.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Region</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={formErrors.state ? "border-red-500" : ""}
          />
          {formErrors.state && (
            <p className="text-sm text-red-500">{formErrors.state}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <CountryCombobox
            items={countries}
            value={formData.country}
            onChange={(value) => handleInputChange({ target: { name: "country", value } })}
            error={formErrors.country}
            shippingRules={shippingRules || []}
          />
          {formErrors.country && (
            <p className="text-sm text-red-500">{formErrors.country}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            className={formErrors.postalCode ? "border-red-500" : ""}
          />
          {formErrors.postalCode && (
            <p className="text-sm text-red-500">{formErrors.postalCode}</p>
          )}
        </div>
      </div>

      {/* Order Notes */}
      <div className="space-y-2 mt-6">
        <Label htmlFor="orderNotes">Order Notes (Optional)</Label>
        <textarea
          id="orderNotes"
          name="orderNotes"
          value={formData.orderNotes || ''}
          onChange={handleInputChange}
          placeholder="Any special instructions for your order..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D2B48C] focus:border-[#D2B48C] resize-none"
          rows={3}
        />
      </div>

      {/* Measurements Guide Confirmation (Required) */}
      <div className={`mt-6 p-4 border rounded-lg ${formErrors.measurementsConfirmed ? 'border-red-500 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3 mb-3">
          <Ruler className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800">Measurements Guide</h3>
            <p className="text-sm text-gray-600 mt-1">
              To ensure the perfect fit, please review our size guide on the product page before ordering.
              Check the <strong>Size Guide</strong> tab on any product page to verify your measurements.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="measurementsConfirmed"
            checked={formData.measurementsConfirmed || false}
            onCheckedChange={(checked) =>
              handleInputChange({ target: { name: 'measurementsConfirmed', value: Boolean(checked) } })
            }
            className={formErrors.measurementsConfirmed ? 'border-red-500' : ''}
          />
          <Label htmlFor="measurementsConfirmed" className="text-sm cursor-pointer">
            I confirm I have reviewed the measurements guide and selected the correct size. *
          </Label>
        </div>
        {formErrors.measurementsConfirmed && (
          <p className="text-sm text-red-500 mt-2">{formErrors.measurementsConfirmed}</p>
        )}
      </div>

      {/* Customer Photo Upload (Optional) */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-start gap-3 mb-3">
          <Upload className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800">Upload Your Photo <span className="text-gray-400 text-sm font-normal">(Optional)</span></h3>
            <p className="text-sm text-gray-600 mt-1">
              A full-length photo helps our tailors create the perfect fit for you.
            </p>
          </div>
        </div>

        {photoPreview ? (
          <div className="relative inline-block mt-2">
            <img src={photoPreview} alt="Your photo" className="w-32 h-40 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
              id="customerPhoto"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="border-dashed border-gray-400"
            >
              {photoUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Choose Photo</>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP · Max 10MB</p>
          </div>
        )}
      </div>

      {/* Shippo Shipping Options */}
      <div className="mt-6">
        <ShippoShippingOptions
          address={formData}
          cartItems={cartItems || []}
          onShippingSelected={onShippingSelected}
          selectedShipping={selectedShipping}
        />
      </div>

      {!user && (
        <div className="mt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createAccount"
              checked={createAccount}
              onCheckedChange={(checked) => setCreateAccount(Boolean(checked))}
            />
            <Label htmlFor="createAccount">Create an account?</Label>
          </div>
          {createAccount && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingInformationForm;
