
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import CartItem from "@/components/shop/CartItem"; 
import { useShop } from "@/context/ShopContext";
import { useToast } from "@/components/ui/use-toast";

const CartItemsList = () => {
  const { cart, removeFromCart, updateCartQuantity, updatingItems } = useShop();
  const { toast } = useToast();

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

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl p-12 text-center shadow-sm"
      >
        <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-gray-400" />
        <h2 className="text-2xl font-light mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">
          Explore our collection and find something you'll love
        </p>
        <Link to="/shop">
          <Button size="lg" className="bg-[#D2B48C] hover:bg-[#C19A6B] transition-colors text-white">
            Browse Products
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
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
  );
};

export default CartItemsList;
