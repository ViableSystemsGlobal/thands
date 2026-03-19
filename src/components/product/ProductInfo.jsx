
import React from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/context/CurrencyContext";

const SIZE_GUIDE = {
  S: { chest: "38", waist: "30-31" },
  M: { chest: "40-41", waist: "32-33" },
  L: { chest: "42-43", waist: "34-35" },
  XL: { chest: "44", waist: "36-38" },
  XXL: { chest: "47", waist: "39-42" },
  XXXL: { chest: "50", waist: "43-45" },
  XXXXL: { chest: "54", waist: "46-48" }
};

// Size order for sorting
const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

// Function to sort sizes in standard order
const sortSizes = (sizes) => {
  if (!sizes || sizes.length === 0) return [];
  
  return [...sizes].sort((a, b) => {
    const sizeA = String(a.size || a.size_name || '').toUpperCase();
    const sizeB = String(b.size || b.size_name || '').toUpperCase();
    
    const indexA = SIZE_ORDER.indexOf(sizeA);
    const indexB = SIZE_ORDER.indexOf(sizeB);
    
    // If both sizes are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the list, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the list, sort alphabetically
    return sizeA.localeCompare(sizeB);
  });
};

const ProductInfo = ({ product, sizes, selectedSize, currentPrice, onSizeSelect, onAddToCart, onToggleWishlist, isInWishlist }) => {
  const { formatPrice } = useCurrency();
  
  // Sort sizes in standard order
  const sortedSizes = React.useMemo(() => sortSizes(sizes), [sizes]);


  if (!product) {
    // This component should ideally not render if product is null. 
    // The parent (ProductDetailLayout) handles the "Product not found" state.
    // However, as a safeguard:
    return null; 
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light mb-2">{product.name}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{product.description}</p>
      </div>

      <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
        <p className="text-3xl font-light text-gray-800 dark:text-gray-100">
          {currentPrice != null ? formatPrice(currentPrice) : (sizes && sizes.length > 0 ? 'Select a size' : 'Price not available')}
        </p>
      </div>

      {sizes && sizes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-100">Select Size</h3>
          <Select
            value={selectedSize?.size ? String(selectedSize.size) : ""}
            onValueChange={(value) => {
              const size = sortedSizes.find(s => String(s.size) === String(value));
              if (size && onSizeSelect) {
                onSizeSelect(size);
              }
            }}
          >
            <SelectTrigger className="w-32 h-10 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {sortedSizes.map((size) => {
                const sizeValue = size.size || size.size_name || size;
                return (
                  <SelectItem key={sizeValue} value={String(sizeValue)}>
                    {sizeValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="measurements" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-slate-700 rounded-md">
          <TabsTrigger value="measurements" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm">Size Guide</TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm">Product Details</TabsTrigger>
        </TabsList>
        <TabsContent value="measurements" className="mt-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-slate-800">
            <table className="w-full text-sm text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium">Size</th>
                  <th className="text-left py-2 font-medium">Chest (inches)</th>
                  <th className="text-left py-2 font-medium">Waist (inches)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SIZE_GUIDE).map(([size, measurements]) => (
                  <tr key={size} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <td className="py-2">{size}</td>
                    <td className="py-2">{measurements.chest}</td>
                    <td className="py-2">{measurements.waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="details" className="mt-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300">
            <ul className="space-y-2">
              <li>• Premium quality fabric blend for comfort and durability.</li>
              <li>• Expertly tailored for a modern, flattering fit.</li>
              <li>• Care: Please check garment label. Typically dry clean or gentle wash.</li>
              <li>• Crafted with pride in Ghana.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-[1fr,auto] gap-4 pt-4">
        <Button
          className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-3 text-base rounded-md"
          onClick={() => onAddToCart()}
          disabled={(sizes && sizes.length > 0 && !selectedSize) || !product}
        >
          Add to Cart
        </Button>
        <Button
          variant="outline"
          size="icon"
                      className={`py-3 px-3 rounded-md border-slate-400 hover:bg-[#D2B48C] hover:text-white hover:border-[#D2B48C] transition-colors ${
            isInWishlist ? "bg-[#D2B48C] text-white border-[#D2B48C]" : "text-slate-700"
          }`}
          onClick={onToggleWishlist}
          disabled={!product}
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ProductInfo;
