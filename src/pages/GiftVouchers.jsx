import React from "react";
import { motion } from "framer-motion";
import { Loader2, Gift } from "lucide-react";
import GiftVoucherCard from "@/components/giftvouchers/GiftVoucherCard";
import TermsAndConditionsSection from "@/components/giftvouchers/GiftVoucherTerms";
import useGiftVouchersPage from "@/hooks/useGiftVouchersPage";
import { useCurrency } from "@/context/CurrencyContext";


const GiftVouchers = () => {
  const {
    voucherTypes,
    loading,
    processingPayment,
    quantities,
    recipientDetails,
    updateQuantity,
    handleRecipientDetailChange,
    handleSimulatedPayment,
    scriptLoaded
  } = useGiftVouchersPage();

  const { loadingRate: currencyLoading } = useCurrency();


  if (loading || currencyLoading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin h-12 w-12 text-gray-700" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-6 text-gray-800 tracking-tight">
            Purchase a Gift Voucher
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The perfect gift for any occasion. Choose a voucher, tell us who it's for, and we'll handle the rest.
          </p>
        </motion.div>

        {voucherTypes.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10 bg-white rounded-lg shadow-md"
          >
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No gift vouchers currently available.</p>
            <p className="text-sm text-gray-500 mt-2">Please check back later or contact support.</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {voucherTypes.map((voucher, index) => (
            <GiftVoucherCard
              key={voucher.id}
              voucher={voucher}
              quantity={quantities[voucher.id] || 1}
              recipientDetails={recipientDetails[voucher.id]}
              processingPayment={processingPayment}
              onQuantityChange={updateQuantity}
              onRecipientDetailChange={handleRecipientDetailChange}
              onSimulatedPayment={handleSimulatedPayment}
              cardIndex={index}
              scriptLoaded={scriptLoaded}
            />
          ))}
        </div>

        <TermsAndConditionsSection defaultValidityMonths={voucherTypes[0]?.validity_months} />
      </div>
    </div>
  );
};

export default GiftVouchers;
