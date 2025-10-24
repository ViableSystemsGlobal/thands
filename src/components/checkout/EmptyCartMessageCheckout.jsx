
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

const EmptyCartMessageCheckout = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto"
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

export default EmptyCartMessageCheckout;
