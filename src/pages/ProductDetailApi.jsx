// New Product Detail page using the new API instead of Supabase
import React from "react";
import { useProductDetailApi } from "@/hooks/useProductDetailApi";
import ProductDetailLayout from "@/components/product/ProductDetailLayout";

const ProductDetailApi = () => {
  const {
    product,
    sizes,
    selectedSize,
    currentPrice,
    relatedProducts,
    generalFAQs, 
    loading,
    productLoading,
    faqsLoading,
    handleSizeSelect,
    handleAddToCart,
    handleToggleWishlist,
    isInWishlist
  } = useProductDetailApi();

  return (
    <div>

      <ProductDetailLayout
        loading={loading}
        productLoading={productLoading}
        faqsLoading={faqsLoading}
        product={product}
        sizes={sizes}
        selectedSize={selectedSize}
        currentPrice={currentPrice}
        relatedProducts={relatedProducts}
        generalFAQs={generalFAQs}
        onSizeSelect={handleSizeSelect}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={isInWishlist}
      />
    </div>
  );
};

export default ProductDetailApi;
