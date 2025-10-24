
import React from "react";
import { useProductDetail } from "@/hooks/useProductDetail";
import ProductDetailLayout from "@/components/product/ProductDetailLayout";

const ProductDetail = () => {
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
  } = useProductDetail();

  return (
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
      handleSizeSelect={handleSizeSelect}
      handleAddToCart={handleAddToCart}
      handleToggleWishlist={handleToggleWishlist}
      isInWishlist={isInWishlist}
    />
  );
};

export default ProductDetail;
