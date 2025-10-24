
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';

const CartHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-10 pb-6 border-b border-gray-200">
      <div className="flex items-center mb-4 sm:mb-0">
        <ShoppingBag className="w-10 h-10 text-[#D2B48C] mr-3" />
        <h1 className="text-3xl md:text-4xl font-light text-gray-800 tracking-tight">Your Shopping Cart</h1>
      </div>
      <Link 
        to="/shop"
        className="text-sm text-[#D2B48C] hover:text-[#C19A6B] flex items-center gap-1.5 transition-colors group font-medium"
      >
        Continue Shopping
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

export default CartHeader;
