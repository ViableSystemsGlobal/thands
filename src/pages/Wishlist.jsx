
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2, Trash2 } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import SizeSelectionDialog from "@/components/shop/SizeSelectionDialog";
import { productSizesApi } from "@/lib/services/productSizesApi";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";

const Wishlist = () => {
  const { wishlist, toggleWishlist, addToCart, loading } = useShop();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [productSizes, setProductSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  const handleAddToCart = async (product) => {
    if (!product || !product.id) {
      console.error("Invalid product data:", product);
      return;
    }
    
    try {
      setLoadingSizes(true);
      
      // Fetch full product details to ensure we have base_price
      const { api } = await import('@/lib/services/api');
      const fullProduct = await api.get(`/products/${product.id}`);
      
      // Merge full product data with existing product data
      const productWithDetails = {
        ...product,
        ...fullProduct,
        base_price: fullProduct.base_price || fullProduct.price || product.price || 0
      };
      
      setSelectedProduct(productWithDetails);

      const sizes = await productSizesApi.fetchProductSizes(product.id);
      setProductSizes(sizes || []);
    } catch (error) {
      console.error("Error fetching product details or sizes:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoadingSizes(false);
    }
  };

  const handleSizeSelected = async (size) => {
    if (!selectedProduct) return;
    
    try {
      setAddingToCartId(selectedProduct.id);
      // addToCart already shows the standard toast notification
      await addToCart(selectedProduct, size);
      
      // Close the dialog after successful addition
      setSelectedProduct(null);
      setProductSizes([]);
    } catch (error) {
      // Error toast is also handled by addToCart, but we can add a fallback
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleRemoveFromWishlist = async (product) => {
    await toggleWishlist(product);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light mb-12"
        >
          My Wishlist
        </motion.h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-6">Your wishlist is empty</p>
            <Link to="/shop">
              <Button variant="outline" className="border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlist.map((item) => {
              const product = item.products;
              if (!product) return null; // Skip if product is undefined
              const isAddingToCart = addingToCartId === product.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group bg-white rounded-xl p-6 shadow-sm"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={getImageUrl(product.image_url) || getPlaceholderImageUrl()}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-medium mb-2">{product.name}</h3>
                  </Link>
                  <div className="grid grid-cols-[1fr,auto] gap-2">
                    <Button
                      className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
                      onClick={() => handleAddToCart(product)}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleRemoveFromWishlist(product)}
                      disabled={isAddingToCart}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <SizeSelectionDialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
            setProductSizes([]);
          }
        }}
        product={selectedProduct}
        sizes={productSizes}
        onSizeSelect={handleSizeSelected}
        loading={loadingSizes}
      />
    </div>
  );
};

export default Wishlist;
