
import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditionsSection = ({ defaultValidityMonths = 12 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="mt-16 bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-light mb-6 text-center text-gray-700">Terms & Conditions</h2>
      <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
        <li>Gift vouchers are valid for the duration specified (typically {defaultValidityMonths} months) from the date of purchase.</li>
        <li>Vouchers can be used for multiple purchases until the full value is redeemed or the voucher expires.</li>
        <li>Vouchers cannot be exchanged for cash.</li>
        <li>Vouchers can be used for online purchases on this website.</li>
        <li>Lost or stolen vouchers cannot be replaced. Please treat them like cash.</li>
        <li>The voucher code will be sent to the recipient's email address upon successful payment.</li>
      </ul>
    </motion.div>
  );
};

export default TermsAndConditionsSection;
