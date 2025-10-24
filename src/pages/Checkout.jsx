import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, ShoppingCart, Loader2, CheckCircle, Edit } from "lucide-react";
import ShippingInformationForm from "@/components/checkout/ShippingInformationForm";
import CheckoutOrderSummary from "@/components/checkout/OrderSummary";
import OrderVerification from "@/components/checkout/OrderVerification";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/context/ShopContext"; 

// Checkout steps
const CHECKOUT_STEPS = {
  SHIPPING: 'shipping',
  VERIFICATION: 'verification'
};

const CheckoutPageHeader = ({ currentStep, onStepChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-gray-200">
    <div className="flex items-center mb-4 sm:mb-0">
      <ShoppingCart className="w-8 h-8 text-[#D2B48C] mr-3" />
      <h1 className="text-3xl font-light text-gray-800 tracking-tight">Secure Checkout</h1>
    </div>
    
    {/* Step Indicator */}
    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
      <div className={`flex items-center ${currentStep === CHECKOUT_STEPS.SHIPPING ? 'text-[#D2B48C]' : 'text-green-600'}`}>
        {currentStep === CHECKOUT_STEPS.VERIFICATION ? (
          <CheckCircle className="w-5 h-5 mr-2" />
        ) : (
          <Edit className="w-5 h-5 mr-2" />
        )}
        <span className="font-medium">1. Shipping Info</span>
      </div>
      <div className={`w-8 h-px ${currentStep === CHECKOUT_STEPS.VERIFICATION ? 'bg-green-600' : 'bg-gray-300'}`}></div>
      <div className={`flex items-center ${currentStep === CHECKOUT_STEPS.VERIFICATION ? 'text-[#D2B48C]' : 'text-gray-400'}`}>
        <CheckCircle className="w-5 h-5 mr-2" />
        <span className="font-medium">2. Verify Order</span>
      </div>
    </div>

    <Link
      to="/cart"
      className="flex items-center text-sm text-[#D2B48C] hover:text-[#C19A6B] transition-colors font-medium group"
    >
      <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
      Back to Cart
    </Link>
  </div>
);

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
  couponLoading,
  onProceedToVerification,
  validateForm
}) => {

  const handleContinueToVerification = () => {
    // Use the existing validation from the checkout form hook
    const isValid = validateForm(formData, createAccount, password);
    
    if (isValid) {
      onProceedToVerification();
    } else {
      console.log('❌ Form validation failed. Please check the form for errors.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12 items-start">
        <div className="lg:col-span-3 space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-sm">
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
          
          {/* Remove the Continue Button from here since it's now in OrderSummary */}
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
            showSubmitButton={true}
            submitButtonText="Continue to Order Verification"
            onSubmit={handleContinueToVerification}
          />
           <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
              <Lock className="w-4 h-4 mr-2 text-green-500" />
              <span>SSL Secure Transaction</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const EmptyCartMessage = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16 bg-white rounded-xl shadow-sm max-w-2xl mx-auto"
  >
    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-semibold text-gray-700 mb-3">Your Cart is Empty</h2>
    <p className="text-gray-500 mb-8">You need items in your cart to proceed to checkout.</p>
    <Link
      to="/shop"
      className="inline-block bg-[#D2B48C] hover:bg-[#C19A6B] text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
    >
      Browse Products
    </Link>
  </motion.div>
);

const PageLoadingSpinner = () => (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-700 mx-auto" />
      <p className="mt-4 text-lg text-gray-700">Loading checkout...</p>
    </div>
  </div>
);


const CheckoutPage = () => {
  const checkoutFormProps = useCheckoutForm();
  const { user } = useAuth();
  const { cart, loading: cartLoading } = useShop();
  const [currentStep, setCurrentStep] = useState(CHECKOUT_STEPS.SHIPPING);

  const handleProceedToVerification = () => {
    setCurrentStep(CHECKOUT_STEPS.VERIFICATION);
  };

  const handleBackToShipping = () => {
    setCurrentStep(CHECKOUT_STEPS.SHIPPING);
  };

  const handleConfirmOrder = async () => {
    console.log('🔘 handleConfirmOrder called - proceeding to payment');
    
    try {
      // This will trigger the actual order processing and payment
      await checkoutFormProps.handleSubmit();
      console.log('✅ handleSubmit completed successfully');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
    }
  };

  if (cartLoading || checkoutFormProps.loading) {
    return <PageLoadingSpinner />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 sm:py-16"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <CheckoutPageHeader 
            currentStep={currentStep} 
            onStepChange={setCurrentStep}
          />
          
          {cart.length === 0 ? (
            <EmptyCartMessage />
          ) : (
            <>
              {currentStep === CHECKOUT_STEPS.SHIPPING && (
                <CheckoutFormGrid 
                  {...checkoutFormProps} 
                  user={user}
                  onProceedToVerification={handleProceedToVerification}
                  validateForm={checkoutFormProps.validateForm}
                />
              )}
              
              {currentStep === CHECKOUT_STEPS.VERIFICATION && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12 items-start">
                  <div className="lg:col-span-3">
                    <OrderVerification
                      formData={checkoutFormProps.formData}
                      shippingRule={checkoutFormProps.shippingRule}
                      calculatedShippingCost={checkoutFormProps.calculatedShippingCost}
                      appliedCoupon={checkoutFormProps.appliedCoupon}
                      couponDiscount={checkoutFormProps.couponDiscount}
                      onBack={handleBackToShipping}
                      loading={checkoutFormProps.loading}
                    />
                  </div>
                  
                  <div className="lg:col-span-2 lg:sticky lg:top-24">
                    <CheckoutOrderSummary
                      shippingRule={checkoutFormProps.shippingRule}
                      loading={checkoutFormProps.loading}
                      calculatedShippingCost={checkoutFormProps.calculatedShippingCost}
                      displayCurrency={checkoutFormProps.displayCurrency}
                      couponCode={checkoutFormProps.couponCode}
                      setCouponCode={checkoutFormProps.setCouponCode}
                      handleApplyCoupon={checkoutFormProps.handleApplyCoupon}
                      handleRemoveCoupon={checkoutFormProps.handleRemoveCoupon}
                      appliedCoupon={checkoutFormProps.appliedCoupon}
                      couponDiscount={checkoutFormProps.couponDiscount}
                      couponLoading={checkoutFormProps.couponLoading}
                      showSubmitButton={true}
                      submitButtonText="Confirm & Proceed to Payment"
                      onSubmit={handleConfirmOrder}
                    />
                    <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                      <Lock className="w-4 h-4 mr-2 text-green-500" />
                      <span>SSL Secure Transaction</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;
