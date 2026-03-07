import React from 'react';
import { Package, Loader2 } from 'lucide-react';

const TopProducts = ({ products = [], loading }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No sales data for this period</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.slice(0, 7).map((product, index) => (
            <li key={product.id} className="flex items-center gap-3">
              {/* Rank */}
              <span className={`text-xs font-bold w-5 text-center shrink-0 ${
                index === 0 ? 'text-yellow-500' :
                index === 1 ? 'text-gray-400' :
                index === 2 ? 'text-amber-600' : 'text-gray-300'
              }`}>
                #{index + 1}
              </span>

              {/* Image */}
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-9 w-9 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-400">
                  {product.total_sold} sold · {product.order_count} orders
                </p>
              </div>

              {/* Revenue */}
              <span className="text-sm font-semibold text-gray-700 shrink-0">
                ${(parseFloat(product.price || 0) * parseInt(product.total_sold || 0)).toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopProducts;
