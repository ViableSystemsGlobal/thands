import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Gift, Send, User, Mail, Loader2, Phone, MessageSquare, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const GiftVoucherCard = ({
  voucher,
  quantity,
  recipientDetails,
  processingPayment,
  onQuantityChange,
  onRecipientDetailChange,
  onSimulatedPayment,
  cardIndex,
  scriptLoaded = true
}) => {
  const { formatPrice } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0); // 0: voucher details, 1: recipient info, 2: purchaser info
  
  // Convert cents to USD - let formatPrice handle the currency conversion
  const voucherAmountUSD = voucher.amount / 100;
  const totalAmountUSD = voucherAmountUSD * quantity;

  const handlePurchaserDetailChange = useCallback((field, value) => {
    onRecipientDetailChange(voucher.id, `purchaser_${field}`, value);
  }, [voucher.id, onRecipientDetailChange]);

  const validateStep = useCallback((step) => {
    switch(step) {
      case 0: // Voucher details - always valid since quantity is auto-set
        return true;
      case 1: // Recipient info
        return recipientDetails?.name?.trim() && recipientDetails?.email?.trim() && /\S+@\S+\.\S+/.test(recipientDetails?.email);
      case 2: // Purchaser info - optional but should have at least name if provided
        return true; // Make purchaser info optional
      default:
        return false;
    }
  }, [recipientDetails]);

  const nextStep = useCallback(() => {
    if (currentStep < 2 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handlePayment = useCallback(() => {
    if (validateStep(1)) { // Only require recipient details
      onSimulatedPayment(voucher);
    }
  }, [validateStep, onSimulatedPayment, voucher]);

  // Step content components - memoized to prevent recreation
  const VoucherDetailsStep = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        {voucher.image_url ? (
          <img
            src={voucher.image_url}
            alt={voucher.name}
            className="w-full h-32 object-cover rounded-lg mb-3 shadow-md"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-[#D2B48C] to-[#C19A6B] rounded-lg mb-3 flex items-center justify-center shadow-md">
            <Gift className="w-12 h-12 text-white opacity-80" />
          </div>
        )}
        <h3 className="text-2xl font-light text-gray-800 mb-1">
          {formatPrice(voucherAmountUSD)}
        </h3>
        <p className="text-[#D2B48C] font-medium">{voucher.name}</p>
        <p className="text-sm text-gray-500 mt-1">{voucher.description}</p>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div><span className="font-medium">Validity:</span> {voucher.validity_months} months</div>
        <div><span className="font-medium">Redeemable for:</span> All store items</div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</Label>
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(voucher.id, -1)}
            disabled={quantity <= 1}
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(voucher.id, 1)}
            disabled={quantity >= 10}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Total: <span className="font-semibold">{formatPrice(totalAmountUSD)}</span>
        </p>
      </div>
    </motion.div>
  ), [voucher, voucherAmountUSD, totalAmountUSD, quantity, onQuantityChange, formatPrice]);

  const RecipientInfoStep = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-gray-800">Recipient Details</h4>
        <p className="text-sm text-gray-600">Who should receive this gift?</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <User className="w-4 h-4 mr-2" /> Recipient's Name *
          </Label>
          <Input
            placeholder="e.g., John Doe"
            value={recipientDetails?.name || ''}
            onChange={(e) => onRecipientDetailChange(voucher.id, 'name', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Mail className="w-4 h-4 mr-2" /> Recipient's Email *
          </Label>
          <Input
            type="email"
            placeholder="e.g., john@example.com"
            value={recipientDetails?.email || ''}
            onChange={(e) => onRecipientDetailChange(voucher.id, 'email', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Send className="w-4 h-4 mr-2" /> Personal Message (Optional)
          </Label>
          <Input
            placeholder="e.g., Happy Birthday!"
            value={recipientDetails?.message || ''}
            onChange={(e) => onRecipientDetailChange(voucher.id, 'message', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </motion.div>
  ), [recipientDetails, voucher.id, onRecipientDetailChange]);

  const PurchaserInfoStep = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-gray-800">Your Details</h4>
        <p className="text-sm text-gray-600">For order confirmation and receipt</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <User className="w-4 h-4 mr-2" /> Your Name (Optional)
          </Label>
          <Input
            placeholder="e.g., Jane Smith"
            value={recipientDetails?.purchaser_name || ''}
            onChange={(e) => handlePurchaserDetailChange('name', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Mail className="w-4 h-4 mr-2" /> Your Email (Optional)
          </Label>
          <Input
            type="email"
            placeholder="e.g., your.email@example.com"
            value={recipientDetails?.purchaser_email || ''}
            onChange={(e) => handlePurchaserDetailChange('email', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Phone className="w-4 h-4 mr-2" /> Your Phone (Optional)
          </Label>
          <Input
            type="tel"
            placeholder="e.g., +1234567890"
            value={recipientDetails?.purchaser_phone || ''}
            onChange={(e) => handlePurchaserDetailChange('phone', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          <strong>Ready to purchase!</strong><br />
          {quantity} x {voucher.name} for {formatPrice(totalAmountUSD)}
        </p>
      </div>
    </motion.div>
  ), [voucher, quantity, formatPrice, recipientDetails?.purchaser_name, recipientDetails?.purchaser_email, recipientDetails?.purchaser_phone, handlePurchaserDetailChange]);

  const stepTitles = ['Choose Voucher', 'Recipient Info', 'Your Details'];

  return (
    <motion.div
      key={voucher.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: cardIndex * 0.1 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-200 hover:shadow-xl transition-shadow duration-300"
    >
      {/* Step indicator */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between text-sm">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index === currentStep ? 'bg-[#D2B48C] text-white' : 
                index < currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 ${index === currentStep ? 'text-[#D2B48C] font-medium' : 'text-gray-600'}`}>
                {title}
              </span>
              {index < stepTitles.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="p-6 flex-grow min-h-[320px]">
        <AnimatePresence mode="wait">
          {currentStep === 0 && <motion.div key="step0">{VoucherDetailsStep}</motion.div>}
          {currentStep === 1 && <motion.div key="step1">{RecipientInfoStep}</motion.div>}
          {currentStep === 2 && <motion.div key="step2">{PurchaserInfoStep}</motion.div>}
        </AnimatePresence>
      </div>

      {/* Navigation and payment */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={processingPayment === voucher.id}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {currentStep < 2 ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep) || processingPayment === voucher.id}
              className="flex-1 bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={processingPayment === voucher.id || !validateStep(1) || !scriptLoaded}
              className="flex-1 bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
            >
              {processingPayment === voucher.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {processingPayment === voucher.id ? 'Processing...' : 'Purchase Now'}
            </Button>
          )}
        </div>
        
        {!scriptLoaded && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            Payment system loading...
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default GiftVoucherCard;
