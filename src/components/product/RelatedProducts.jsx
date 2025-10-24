import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import { useCurrency } from "@/context/CurrencyContext";

const RelatedProducts = ({ products }) => {
  const { formatPrice } = useCurrency();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `https://fqnzrffsscrhknfzewxd.supabase.co/storage/v1/object/public/uploads/${imagePath}`;
  };

  // Randomly select 3 products from the available products
  const randomProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Create a copy of the products array and shuffle it
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    
    // Return only the first 3 products
    return shuffled.slice(0, 3);
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-light mb-8">Related products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {randomProducts.map((relatedProduct) => {
          const defaultSizeInfo = relatedProduct.product_sizes?.find(size => size.size === 'M') || relatedProduct.product_sizes?.[0];
          const defaultPrice = defaultSizeInfo?.price;

          return (
            <Link 
              key={relatedProduct.id} 
              to={`/product/${relatedProduct.id}`}
              className="group"
            >
              <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg">
                <img
                  src={getImageUrl(relatedProduct.image_url) || "https://via.placeholder.com/300x400?text=No+Image"}
                  alt={relatedProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-medium mb-2">{relatedProduct.name}</h3>
              <p className="text-gray-600">{defaultPrice ? formatPrice(defaultPrice) : 'Price unavailable'}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
