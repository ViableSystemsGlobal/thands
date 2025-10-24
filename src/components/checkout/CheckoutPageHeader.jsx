
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const CheckoutPageHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-gray-200">
    <div className="flex items-center mb-4 sm:mb-0">
      <ShoppingCart className="w-8 h-8 text-[#D2B48C] mr-3" />
      <h1 className="text-3xl font-light text-gray-800 tracking-tight">Secure Checkout</h1>
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

export default CheckoutPageHeader;
