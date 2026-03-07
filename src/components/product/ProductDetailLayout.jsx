
import React from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { Loader2, Star, ShoppingCart, Heart, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import ProductImage from './ProductImage';
import ProductInfo from './ProductInfo';
import RelatedProducts from './RelatedProducts';
import ProductFAQSection from './ProductFAQSection'; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const ProductDetailLayout = ({
  loading,
  productLoading,
  faqsLoading,
  product,
  sizes,
  selectedSize,
  currentPrice,
  relatedProducts,
  generalFAQs,
  handleSizeSelect,
  onSizeSelect,
  handleAddToCart,
  onAddToCart,
  handleToggleWishlist,
  onToggleWishlist,
  isInWishlist,
}) => {
  // Support both prop naming conventions for backward compatibility
  const sizeSelectHandler = onSizeSelect || handleSizeSelect;
  const addToCartHandler = onAddToCart || handleAddToCart;
  const toggleWishlistHandler = onToggleWishlist || handleToggleWishlist;
  const { formatPrice, convertToActiveCurrency, currency } = useCurrency();

  if (loading || productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
        <p className="ml-4 text-2xl font-semibold text-white">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4 bg-gray-50">
        <img  alt="Sad product box" className="w-40 h-40 mb-6 opacity-50" src="https://images.unsplash.com/photo-1693341978693-124bc458e2a6" />
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">We couldn't find the product you're looking for. It might have been removed or the link is incorrect.</p>
        <Button onClick={() => window.history.back()} variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-50">
          Go Back
        </Button>
      </div>
    );
  }
  
  const displayPrice = currentPrice !== null ? convertToActiveCurrency(currentPrice) : (product.product_sizes?.[0]?.price ? convertToActiveCurrency(product.product_sizes[0].price) : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-28 pb-16 bg-gradient-to-br from-slate-50 to-purple-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ProductImage imageUrl={product.image_url} productName={product.name} />
          
          <ProductInfo
            product={product}
            sizes={sizes}
            selectedSize={selectedSize}
            currentPrice={currentPrice}
            onSizeSelect={sizeSelectHandler}
            onAddToCart={addToCartHandler}
            onToggleWishlist={toggleWishlistHandler}
            isInWishlist={isInWishlist}
          />
        </div>

        <div className="mt-16 lg:mt-24">
          <Accordion type="single" collapsible defaultValue="description" className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger className="text-xl font-semibold text-gray-800 hover:text-purple-600 py-4">
                Product Description
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed prose max-w-none py-4">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || "<p>No description available.</p>") }} />
              </AccordionContent>
            </AccordionItem>
            
            {product.additional_details && Object.keys(product.additional_details).length > 0 && (
              <AccordionItem value="additional-details">
                <AccordionTrigger className="text-xl font-semibold text-gray-800 hover:text-purple-600 py-4">
                  Additional Details
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 py-4">
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(product.additional_details).map(([key, value]) => (
                      <li key={key}><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="faqs">
               <AccordionTrigger className="text-xl font-semibold text-gray-800 hover:text-purple-600 py-4">
                Product FAQs
              </AccordionTrigger>
              <AccordionContent className="py-4">
                <ProductFAQSection 
                  productId={product.id} 
                  generalFAQs={generalFAQs} 
                  loading={faqsLoading} 
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}
      </div>
    </motion.div>
  );
};

export default ProductDetailLayout;

