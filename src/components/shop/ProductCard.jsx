import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useShop } from '@/context/ShopContext';
import LazyImage from '@/components/ui/LazyImage';
import { getImageUrl, getPlaceholderImageUrl } from '@/lib/utils/imageUtils';

const ProductCard = ({ product, onAddToCart }) => {
  const { formatPrice, convertToActiveCurrency, exchangeRate, currency } = useCurrency();
  const { toggleWishlist, isInWishlist } = useShop();

  // Use optimized image URL for better performance
  const optimizedImageUrl = getImageUrl(product.image_url);

  const getOriginalPriceUSD = () => {
    const mediumSize = product.product_sizes?.find(size => size.size === 'M');
    return mediumSize?.price || product.product_sizes?.[0]?.price || 0;
  };
  
  const originalPriceUSD = getOriginalPriceUSD();

  // Temporary debug logging
  if (currency === "GHS" && product.product_sizes?.[0]) {
    console.log('🛍️ ProductCard Fixed:', {
      productName: product.name,
      originalPriceUSD: originalPriceUSD,
      exchangeRate: exchangeRate,
      currency: currency,
      finalDisplayPrice: formatPrice(originalPriceUSD),
      allSizes: product.product_sizes?.map(s => ({ size: s.size, price: s.price }))
    });
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-transparent hover:border-amber-400 transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
        <LazyImage
          src={optimizedImageUrl || "https://via.placeholder.com/300x400?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.product_type && (
           <span className={`absolute top-2 left-2 text-white text-xs font-semibold px-2 py-1 rounded shadow-md ${
             product.product_type === 'ready_to_wear' 
               ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
               : 'bg-gradient-to-r from-purple-500 to-purple-600'
           }`}>
             {product.product_type === 'ready_to_wear' ? 'Ready to Wear' : 'Made to Measure'}
           </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 text-gray-800 group-hover:text-[#D2B48C] transition-colors truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2 capitalize">{product.category || 'Uncategorized'}</p>
        </Link>
        
        <p className="text-xl font-bold text-[#D2B48C] mb-3">
          {formatPrice(originalPriceUSD)}
        </p>

        <div className="mt-auto grid grid-cols-[1fr,auto] gap-2 items-center">
          <Button
            className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white w-full transition-all duration-300 py-3 text-sm font-medium shadow-md hover:shadow-lg"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`border-slate-300 hover:bg-[#D2B48C] hover:text-white hover:border-[#D2B48C] transition-colors duration-300 ${
              isInWishlist(product.id) ? "bg-[#D2B48C] text-white border-[#D2B48C] hover:bg-[#C19A6B]" : "text-slate-600"
            }`}
            onClick={() => toggleWishlist(product)}
            aria-label={isInWishlist(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
