
import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = () => {
  const steps = [
    { num: 1, title: "Select Voucher", desc: "Choose value and quantity." },
    { num: 2, title: "Add Recipient", desc: "Enter recipient's details." },
    { num: 3, title: "Simulate Payment", desc: "Click 'Buy' to complete." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-16 max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-light mb-8 text-center text-gray-700">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="text-center p-4 bg-white rounded-lg shadow-md border border-gray-100">
            <div className="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-semibold">{step.num}</span>
            </div>
            <h3 className="font-medium text-gray-800 mb-1.5">{step.title}</h3>
            <p className="text-xs text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default HowItWorksSection;
