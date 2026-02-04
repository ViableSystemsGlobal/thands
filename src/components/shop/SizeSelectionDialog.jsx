import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const SizeGuideTable = () => (
  <div className="mt-6 p-3 border rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 shadow-sm">
    <h4 className="text-sm font-semibold mb-2 text-gray-700">Suit Size Guide (inches)</h4>
    <table className="w-full text-xs text-left text-gray-600">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="py-1.5 pr-2 font-medium">Size</th>
          <th className="py-1.5 pr-2 font-medium">Chest</th>
          <th className="py-1.5 pr-2 font-medium">Waist</th>
          <th className="py-1.5 font-medium">Sleeve</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-200">
          <td className="py-1.5">S</td>
          <td className="py-1.5">36-38</td>
          <td className="py-1.5">30-32</td>
          <td className="py-1.5">24-24.5</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="py-1.5">M</td>
          <td className="py-1.5">38-40</td>
          <td className="py-1.5">32-34</td>
          <td className="py-1.5">24.5-25</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="py-1.5">L</td>
          <td className="py-1.5">40-42</td>
          <td className="py-1.5">34-36</td>
          <td className="py-1.5">25-25.5</td>
        </tr>
        <tr>
          <td className="py-1.5">XL</td>
          <td className="py-1.5">42-44</td>
          <td className="py-1.5">36-38</td>
          <td className="py-1.5">25.5-26</td>
        </tr>
      </tbody>
    </table>
    <p className="text-xs text-gray-500 mt-2 italic">This is a general guide. Fit may vary by style.</p>
  </div>
);

const SizeSelectionDialog = ({ open, onOpenChange, product, sizes, onSizeSelect, loading }) => {
  const { formatPrice } = useCurrency();

  if (!product) return null;

  // Use sizes prop if provided, otherwise fall back to product.product_sizes
  const availableSizes = sizes && sizes.length > 0 ? sizes : (product.product_sizes || []);
  
  // Calculate price for a size
  const calculateSizePrice = (size) => {
    // Try different ways to get the base price
    // Backend sets base_price from price field, but wishlist products might only have price
    // Also handle case where price might be in different formats
    let basePrice = 0;
    if (product.base_price !== undefined && product.base_price !== null) {
      basePrice = parseFloat(product.base_price);
    } else if (product.price !== undefined && product.price !== null) {
      basePrice = parseFloat(product.price);
    }
    
    // Try different ways to get the price adjustment
    // Size objects have price_adjustment field
    let priceAdjustment = 0;
    if (size.price_adjustment !== undefined && size.price_adjustment !== null) {
      priceAdjustment = parseFloat(size.price_adjustment);
    } else if (size.price !== undefined && size.price !== null) {
      priceAdjustment = parseFloat(size.price);
    }
    
    // Calculate total price
    const totalPrice = basePrice + priceAdjustment;
    
    // Debug logging for troubleshooting
    if (totalPrice === 0 || isNaN(totalPrice)) {
      console.warn('⚠️ Price calculation issue:', {
        basePrice,
        priceAdjustment,
        totalPrice,
        product: { 
          base_price: product.base_price, 
          price: product.price,
          id: product.id,
          name: product.name
        },
        size: { 
          price_adjustment: size.price_adjustment, 
          price: size.price,
          size: size.size,
          id: size.id
        }
      });
    }
    
    return isNaN(totalPrice) ? 0 : totalPrice;
  };

  const getDisplayPrice = (priceInUSD) => {
    if (!priceInUSD || priceInUSD === 0) {
      return 'Price unavailable';
    }
    return formatPrice(priceInUSD);
  };

  const handleSizeClick = (size) => {
    if (!size) {
      console.error('Invalid size object:', size);
      return;
    }
    
    if (!onSizeSelect) {
      console.error('onSizeSelect callback is not available');
      return;
    }
    
    console.log('Size clicked:', size);
    try {
      onSizeSelect(size);
      // Close dialog after selection (optional - let parent handle it)
      // onOpenChange(false);
    } catch (error) {
      console.error('Error in onSizeSelect callback:', error);
    }
  };

  if (availableSizes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-gray-50 to-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-center text-gray-800">Select Your Size</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-600">
            <p>No sizes available for this product.</p>
            <SizeGuideTable />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-gray-50 to-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-center text-gray-800">Select Your Size</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-2 gap-4">
            {availableSizes.map((size) => (
              <Button
                key={size.size || size.id}
                onClick={() => handleSizeClick(size)}
                disabled={loading}
                variant="outline"
                className="h-20 text-lg flex flex-col items-center justify-center 
                           border-gray-300 hover:border-[#D2B48C] hover:bg-[#D2B48C] 
                           hover:text-white transition-all duration-300 
                           ease-in-out transform hover:scale-105 shadow-sm hover:shadow-md
                           focus:ring-2 focus:ring-offset-2 focus:ring-[#D2B48C] group"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="font-medium text-xl">{size.size}</span>
                    <span className="text-sm text-gray-500 group-hover:text-gray-200">
                      {getDisplayPrice(calculateSizePrice(size))}
                    </span>
                  </>
                )}
              </Button>
            ))}
          </div>
          <SizeGuideTable />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SizeSelectionDialog;
