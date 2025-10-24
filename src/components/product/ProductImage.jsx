
import React from 'react';
import { motion } from "framer-motion";
import LazyImage from '@/components/ui/LazyImage';
import { getImageUrl, getPlaceholderImageUrl } from '@/lib/utils/imageUtils';

const ProductImage = ({ imageUrl, productName }) => {
  // Use optimized image URL for better performance
  const processedImageUrl = getImageUrl(imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="aspect-[3/4] overflow-hidden rounded-lg">
        <LazyImage
          src={processedImageUrl || getPlaceholderImageUrl()}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>
  );
};

export default ProductImage;
