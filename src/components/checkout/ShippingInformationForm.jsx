import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryCombobox } from "@/components/shop/CountryCombobox";
import { countries } from "@/lib/location-data";
import { History } from "lucide-react";
import ShippoShippingOptions from "./ShippoShippingOptions";
import GoogleAddressAutocomplete from "./GoogleAddressAutocomplete";

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
