// Custom ProductCard for API shop that links to API product detail pages
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useShop } from '@/context/ShopContext';
import LazyImage from '@/components/ui/LazyImage';
import { getImageUrl, getPlaceholderImageUrl } from '@/lib/utils/imageUtils';
import exchangeRateService from '@/lib/services/exchangeRate';

const ProductCardApi = ({ product, onAddToCart }) => {
  const { formatPrice, convertToActiveCurrency, exchangeRate, currency } = useCurrency();
  
  // Debug: Check if we're in a ShopProvider context
  let shopContext;
  try {
    shopContext = useShop();
  } catch (error) {
    console.error('ProductCardApi: Not in ShopProvider context:', error);
    // Return a fallback component or handle the error gracefully
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="aspect-[3/4] bg-gray-200"></div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 text-gray-800">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2 capitalize">{product.category || 'Uncategorized'}</p>
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(product.base_price || 0, false, currency, false)}
          </div>
        </div>
      </div>
    );
  }
  
  const { toggleWishlist, isInWishlist } = shopContext;

  // Memoize image URL to prevent recalculation on every render (use thumb for cards)
  const optimizedImageUrl = useMemo(() => {
    return getImageUrl(product.image_url, 'thumb');
  }, [product.image_url]);

  // Memoize price calculation to prevent recalculation on every render
  const priceInfo = useMemo(() => {
    const mediumSize = product.product_sizes?.find(size => size.size === 'M');
    const selectedSize = mediumSize || product.product_sizes?.[0];
    const basePriceUSD = product.base_price || 0; // base_price is actually USD
    const priceAdjustment = selectedSize?.price_adjustment || 0;
    const totalPriceUSD = basePriceUSD + priceAdjustment;
    
    // Convert to active currency using existing currency context
    const convertedPrice = convertToActiveCurrency(totalPriceUSD);
    
    console.log(`🔄 ProductCardApi (${product.name}): USD ${totalPriceUSD} → ${currency} ${convertedPrice}`);
    
    return {
      usd: totalPriceUSD,
      converted: convertedPrice
    };
  }, [product.base_price, product.product_sizes, convertToActiveCurrency, product.name, currency]);


  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.product_sizes && product.product_sizes.length > 1) {
      onAddToCart(product);
    } else {
      const size = product.product_sizes?.[0] || { size: 'One Size', price_adjustment: 0 };
      onAddToCart(product, size);
    }
  };

  const isProductInWishlist = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-transparent hover:border-amber-400 transition-all duration-300"
    >
      {/* Link to API product detail page */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
        <LazyImage
          src={optimizedImageUrl || getPlaceholderImageUrl()}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Product type badge - top left */}
        <span className="absolute top-3 left-3 text-[10px] text-white bg-blue-500 px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium">
          {product.product_type === 'made_to_measure' ? 'Made to Measure' : 
           product.product_type === 'ready_to_wear' ? 'Ready to Wear' : 
           product.product_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Made to Measure'}
        </span>
        
        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
            isProductInWishlist 
              ? 'bg-[#D2B48C] text-white' 
              : 'bg-white text-gray-600 hover:bg-[#D2B48C] hover:text-white'
          }`}
          aria-label={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            className={`w-4 h-4 ${isProductInWishlist ? 'fill-current' : ''}`} 
          />
        </button>
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        {/* Link to API product detail page */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 text-gray-800 group-hover:text-[#D2B48C] transition-colors truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2 capitalize">{product.category || 'Uncategorized'}</p>
        </Link>
        
        <div className="flex items-center justify-between mb-3 mt-auto">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(priceInfo.converted, false, currency, true)}
          </div>
          <div className="text-xs text-gray-500">
            {product.product_sizes?.length > 1 ? `${product.product_sizes.length} sizes` : 'One size'}
          </div>
        </div>
        
        <Button
          onClick={handleAddToCartClick}
          className="w-full bg-[#D2B48C] hover:bg-[#C4A484] text-white font-medium py-2 transition-colors"
        >
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCardApi;
