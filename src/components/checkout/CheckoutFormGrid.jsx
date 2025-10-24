
import React from 'react';
import ShippingInformationForm from "@/components/checkout/ShippingInformationForm";
import CheckoutOrderSummary from "@/components/checkout/OrderSummary";
import { Lock } from "lucide-react";

const CheckoutFormGrid = ({
  formData,
  handleInputChange,
  password,
  setPassword,
  createAccount,
  setCreateAccount,
  shippingRule,
  shippingRules,
  loading,
  formErrors,
  handleSubmit,
  previousAddresses,
  setSelectedAddress,
  calculatedShippingCost,
  user,
  displayCurrency,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  appliedCoupon,
  couponDiscount,
  couponLoading
}) => (
  <form onSubmit={handleSubmit} className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12 items-start">
      <div className="lg:col-span-3 space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <ShippingInformationForm
          formData={formData}
          handleInputChange={handleInputChange}
          formErrors={formErrors}
          user={user}
          previousAddresses={previousAddresses}
          setSelectedAddress={setSelectedAddress}
          createAccount={createAccount}
          setCreateAccount={setCreateAccount}
          password={password}
          setPassword={setPassword}
          shippingRules={shippingRules}
        />
      </div>
      
      <div className="lg:col-span-2 lg:sticky lg:top-24">
        <CheckoutOrderSummary
          shippingRule={shippingRule}
          loading={loading}
          calculatedShippingCost={calculatedShippingCost}
          displayCurrency={displayCurrency}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          handleApplyCoupon={handleApplyCoupon}
          handleRemoveCoupon={handleRemoveCoupon}
          appliedCoupon={appliedCoupon}
          couponDiscount={couponDiscount}
          couponLoading={couponLoading}
        />
         <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Lock className="w-4 h-4 mr-2 text-green-500" />
            <span>SSL Secure Transaction</span>
          </div>
      </div>
    </div>
  </form>
);

export default CheckoutFormGrid;
