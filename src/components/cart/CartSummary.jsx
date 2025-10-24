
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencySelect } from "@/components/ui/currency-select";
import { useToast } from "@/components/ui/use-toast";
import CheckoutChoiceModal from "./CheckoutChoiceModal";

const CartSummary = () => {
  const { cart, cartTotal } = useShop();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before proceeding to checkout",
        variant: "destructive",
      });
      return;
    }
    setShowCheckoutModal(true);
  };

  return (
    <div className="lg:sticky lg:top-24 h-fit">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-full bg-[#D2B48C] flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-medium">Order Summary</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-lg">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between text-xl font-medium">
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 mb-6">
          <CurrencySelect />
        </div>
        <Button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-6 text-lg disabled:opacity-50"
        >
          Proceed to Checkout • {formatPrice(cartTotal)}
        </Button>
      </motion.div>
      
      {/* Checkout Choice Modal */}
      <CheckoutChoiceModal 
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />
    </div>
  );
};

export default CartSummary;
