
import React from 'react';
import ProductCard from './ProductCard';
import { Loader2 } from 'lucide-react';

const ProductGrid = ({ products, loading, onAddToCart }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-600">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-3 text-lg font-semibold">Loading Products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl text-gray-500 font-light">No products found matching your criteria.</p>
        <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
};

export default ProductGrid;
