
import React from 'react';
import { motion } from "framer-motion";
import { ChevronDown } from 'lucide-react';

const ProductFAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div 
      className="border-b"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <button
        className="flex justify-between items-center w-full py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-800">{faq.question}</span>
        <ChevronDown 
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-4 text-gray-600"
        >
          {faq.answer}
        </motion.div>
      )}
    </motion.div>
  );
};


const ProductFAQSection = ({ faqs, loading }) => {
  if (loading) {
    return <p className="text-gray-500 text-sm">Loading FAQs...</p>;
  }
  if (!faqs || faqs.length === 0) {
    return <p className="text-gray-500 text-sm">No FAQs available for this product.</p>;
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-light mb-6">Frequently Asked Questions</h2>
      <div className="border rounded-lg p-2 sm:p-4">
        {faqs.map((faq, index) => (
          <ProductFAQItem key={faq.id || index} faq={faq} />
        ))}
      </div>
    </div>
  );
};

export default ProductFAQSection;
