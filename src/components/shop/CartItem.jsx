import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import LazyImage from "@/components/ui/LazyImage";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";

const CartItem = React.forwardRef(({ 
  item, 
  onQuantityChange, 
  onRemove, 
  isUpdating 
}, ref) => {
  const [error, setError] = useState(null);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const { formatPrice } = useCurrency();

  // Calculate the correct unit price
  const unitPrice = item.price || (item.products?.price) || 0;
  
  // Debug logging
  React.useEffect(() => {
    console.log('CartItem debug:', {
      itemId: item.id,
      itemPrice: item.price,
      itemProducts: item.products,
      unitPrice: unitPrice,
      formattedPrice: formatPrice(unitPrice)
    });
  }, [item, unitPrice, formatPrice]);

  const handleQuantityChange = async (change) => {
    const newQuantity = localQuantity + change;
    setError(null);

    if (newQuantity < 1) {
      setError("Minimum quantity is 1");
      return;
    }
    
    if (newQuantity > 10) {
      setError("Maximum quantity is 10");
      return;
    }

    try {
      setLocalQuantity(newQuantity);
      await onQuantityChange(item.id, newQuantity);
    } catch (err) {
      setLocalQuantity(item.quantity);
      setError("Failed to update quantity");
      console.error("Error updating quantity:", err);
    }
  };

  React.useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
      className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-4"
    >
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="w-full md:w-32 h-48 md:h-32 overflow-hidden rounded-lg bg-gray-100">
          <LazyImage
            src={getImageUrl(item.products?.image_url) || getPlaceholderImageUrl()}
            alt={item.products?.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-medium mb-1">{item.products?.name}</h3>
              <p className="text-gray-500">Size: {item.size}</p>
            </div>
            <p className="text-xl font-medium mt-2 md:mt-0">{formatPrice(unitPrice)}</p>
          </div>
          <div className="flex flex-col gap-2">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full transition-colors hover:bg-gray-100"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isUpdating || localQuantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    localQuantity
                  )}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full transition-colors hover:bg-gray-100"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isUpdating || localQuantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                onClick={() => onRemove(item.id)}
                disabled={isUpdating}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-xl font-medium">{formatPrice(unitPrice * localQuantity)}</p>
        </div>
      </div>
    </motion.div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
