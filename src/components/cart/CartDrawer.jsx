import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, ArrowRight } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";
import CartItem from "@/components/shop/CartItem";
import CheckoutChoiceModal from "@/components/cart/CheckoutChoiceModal";

const CartDrawer = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { cart, cartTotal, removeFromCart, updateCartQuantity, updatingItems } = useShop();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      toast({
        title: "Error",
        description: "Minimum quantity is 1",
        variant: "destructive",
      });
      return;
    }
    if (newQuantity > 10) {
      toast({
        title: "Error",
        description: "Maximum quantity is 10",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateCartQuantity(itemId, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before proceeding to checkout",
        variant: "destructive",
      });
      return;
    }
    // Close the cart drawer first
    onOpenChange(false);
    // Small delay to let drawer close animation finish
    setTimeout(() => {
      setShowCheckoutModal(true);
    }, 300);
  };

  const handleViewFullCart = () => {
    onOpenChange(false);
    navigate("/cart");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBag className="h-6 w-6 text-[#D2B48C]" />
              Shopping Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-8rem)]">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <h2 className="text-2xl font-light mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">
                  Explore our collection and find something you'll love
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/shop");
                  }}
                  className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <CartItem
                        key={`${item.id}-${item.size || item.gift_voucher_type_id}`}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                        isUpdating={updatingItems.has(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t pt-4 mt-4 space-y-4 bg-white">
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span>Total</span>
                    <span className="text-2xl">{formatPrice(cartTotal)}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-6 text-lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Checkout
                    </Button>
                    <Button
                      onClick={handleViewFullCart}
                      variant="outline"
                      className="w-full py-6 text-lg"
                    >
                      View Full Cart
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CheckoutChoiceModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />
    </>
  );
};

export default CartDrawer;

