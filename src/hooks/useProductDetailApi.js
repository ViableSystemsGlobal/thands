// New product detail hook using the new API instead of Supabase
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';
// import { fetchGeneralFAQs } from '@/lib/db/faqs'; // Temporarily disabled
import { useShop } from '@/context/ShopContext';

export const useProductDetailApi = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, toggleWishlist, isInWishlist: isProductInWishlist } = useShop();

  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [generalFAQs, setGeneralFAQs] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(true);
  
  const currentProductIsInWishlist = product ? isProductInWishlist(product.id) : false;

  const fetchProductAndFAQsData = useCallback(async () => {
    setProductLoading(true);
    setFaqsLoading(true);
    
    let productFetchError = null;

    try {
      // Fetch product from new API
      const productData = await api.get(`/products/${productId}`);

      if (!productData) {
        throw new Error("Product not found");
      }

      // API returns product directly, not wrapped in { product }
      const product = productData;
      setProduct(product);
      setSizes(product.product_sizes || []);
      
      const defaultSize = product.product_sizes?.find(s => s.size === 'M') || product.product_sizes?.[0];
      if (defaultSize) {
        setSelectedSize(defaultSize); 
        setCurrentPrice(defaultSize.price_adjustment ? 
          product.base_price + defaultSize.price_adjustment : 
          product.base_price
        );
      } else {
        setCurrentPrice(product.base_price);
      }

      // Fetch related products from same category
      try {
        const relatedData = await api.get(`/products?category=${encodeURIComponent(product.category)}&limit=4&exclude=${productId}`);
        setRelatedProducts(relatedData.products || []);
      } catch (relatedError) {
        console.warn("Could not fetch related products:", relatedError);
        setRelatedProducts([]);
      }

    } catch (error) {
      console.error("Error fetching product:", error);
      productFetchError = error;
      
      if (error.message === "Product not found") {
        toast({ 
          title: "Product Not Found", 
          description: "The product you're looking for doesn't exist.", 
          variant: "destructive" 
        });
        navigate('/shop');
        return;
      }
      
      toast({ 
        title: "Error", 
        description: "Failed to load product details.", 
        variant: "destructive" 
      });
    } finally {
      setProductLoading(false);
    }

    // Fetch FAQs for this product
    try {
      const [productFaqs, generalFaqs] = await Promise.all([
        api.get(`/faqs/product/${productId}`).catch(() => []),
        api.get('/faqs/general').catch(() => []),
      ]);
      setGeneralFAQs([...(productFaqs || []), ...(generalFaqs || [])]);
    } catch (faqError) {
      console.error("Error fetching FAQs:", faqError);
      setGeneralFAQs([]);
    } finally {
      setFaqsLoading(false);
    }
  }, [productId, navigate, toast]);

  useEffect(() => {
    if (productId) {
      fetchProductAndFAQsData();
    }
  }, [productId, fetchProductAndFAQsData]);

  const handleSizeSelect = useCallback((size) => {
    setSelectedSize(size);
    setCurrentPrice(size.price_adjustment ? 
      product.base_price + size.price_adjustment : 
      product.base_price
    );
  }, [product]);

  const handleAddToCart = useCallback(async (selectedSizeForCart = selectedSize) => {
    if (!product || !selectedSizeForCart) {
      toast({ 
        title: "Error", 
        description: "Please select a size before adding to cart.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      await addToCart(product, selectedSizeForCart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({ 
        title: "Error", 
        description: "Failed to add item to cart.", 
        variant: "destructive" 
      });
    }
  }, [product, selectedSize, addToCart, toast]);

  const handleToggleWishlist = useCallback(async () => {
    if (!product) return;

    try {
      await toggleWishlist(product);
      toast({ 
        title: currentProductIsInWishlist ? "Removed from Wishlist" : "Added to Wishlist",
        description: `${product.name} ${currentProductIsInWishlist ? 'removed from' : 'added to'} your wishlist.`
      });
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update wishlist.", 
        variant: "destructive" 
      });
    }
  }, [product, currentProductIsInWishlist, toggleWishlist, toast]);

  const isInWishlist = useCallback((productId) => {
    return isProductInWishlist(productId);
  }, [isProductInWishlist]);

  const loading = productLoading || faqsLoading;

  return {
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
    isInWishlist,
    currentProductIsInWishlist,
    refetch: fetchProductAndFAQsData
  };
};
