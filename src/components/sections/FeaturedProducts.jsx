
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useShop } from "@/context/ShopContext";
import { productsApi } from "@/lib/services/productsApi";
import { useCurrency } from "@/context/CurrencyContext";
import SizeSelectionDialog from "@/components/shop/SizeSelectionDialog";
import LazyImage from "@/components/ui/LazyImage";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";

const FeaturedProducts = () => {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSizes, setProductSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsApi.fetchProducts({
        limit: 3,
        active: 'true'
      });
      setProducts(response.products || []);
    } catch (err) {
      console.error("Error fetching featured products:", err);
      toast({
        title: "Error",
        description: "Failed to load featured products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    setSelectedProduct(product);
    setSizeDialogOpen(true);
  };

  const handleWishlist = (e, product) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleSizeSelect = async (size) => {
    if (selectedProduct && size) {
      await addToCart(selectedProduct, size);
      setSizeDialogOpen(false);
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-light mb-2">Featured Products</h2>
            <p className="text-gray-600">Our most popular designs</p>
          </div>
          <Link 
            to="/shop" 
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-3 text-center py-12">No featured products found</div>
          ) : (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden">
                    <LazyImage 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={product.name}
                      src={getImageUrl(product.image_url) || getPlaceholderImageUrl()} />
                  </div>
                  <h3 className="text-xl font-light mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <p className="text-lg font-semibold mb-4">
                    {formatPrice(product.base_price + (product.product_sizes?.[0]?.price_adjustment || 0))}
                  </p>
                </Link>
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <Button 
                    className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                                          className={`border-[#D2B48C] hover:bg-[#D2B48C] hover:text-white transition-colors ${
                      isInWishlist(product.id) ? "bg-[#D2B48C] text-white" : ""
                    }`}
                    onClick={(e) => handleWishlist(e, product)}
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <SizeSelectionDialog
          open={sizeDialogOpen}
          onOpenChange={setSizeDialogOpen}
          product={selectedProduct}
          onSizeSelect={handleSizeSelect}
          loading={loadingSizes}
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;
