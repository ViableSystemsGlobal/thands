
import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import CartItemsList from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";
import CartHeader from "@/components/cart/CartHeader";
import EmptyCartMessage from "@/components/cart/EmptyCartMessage";

const CartPage = () => {
  const { loading, cart } = useShop();

  if (loading && (!cart || cart.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-medium">Loading your cart...</p>
          <p className="text-gray-500">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          <CartHeader />

          {(!cart || cart.length === 0) && !loading ? (
            <EmptyCartMessage />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
              <div className="lg:col-span-2">
                <CartItemsList />
              </div>
              <div className="lg:col-span-1">
               <CartSummary />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;
