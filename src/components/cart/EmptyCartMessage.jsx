
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyCartMessage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 bg-white rounded-xl shadow-lg"
    >
      <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h2 className="text-2xl font-semibold text-gray-700 mb-3">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
      <Link
        to="/shop"
        className="inline-block bg-[#D2B48C] hover:bg-[#C19A6B] text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        Start Shopping
      </Link>
    </motion.div>
  );
};

export default EmptyCartMessage;
