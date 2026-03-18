import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';
import { fetchGeneralFAQs } from '@/lib/db/faqs';
import { useShop } from '@/context/ShopContext';

export const useProductDetail = () => {
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

    try {
      const data = await api.get(`/products/${productId}`);
      const productData = data.product || data;

      if (!productData || !productData.id) {
        throw new Error("Product not found");
      }

      setProduct(productData);
      setSizes(productData.product_sizes || []);
      const defaultSize = productData.product_sizes?.find(s => s.size === 'M') || productData.product_sizes?.[0];
      if (defaultSize) {
        setSelectedSize(defaultSize);
        setCurrentPrice(defaultSize.price);
      } else if (productData.product_sizes && productData.product_sizes.length > 0) {
        setSelectedSize(null);
        setCurrentPrice(null);
      } else {
        setCurrentPrice(productData.base_price || null);
      }
    } catch (error) {
      console.error("Error fetching product details:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to load product details.",
        variant: "destructive",
      });
      setProduct(null);
      if (error.message !== "Product not found") {
        navigate('/shop');
      }
    } finally {
      setProductLoading(false);
    }

    try {
      const { data: faqsData, error: faqsError } = await fetchGeneralFAQs();
      if (faqsError) {
        console.error("Error fetching general FAQs:", faqsError.message);
        toast({
          title: "Could not load FAQs",
          description: "There was an issue loading FAQs at this time. " + faqsError.message,
          variant: "default",
        });
        setGeneralFAQs([]);
      } else {
        setGeneralFAQs(faqsData || []);
      }
    } catch (faqFetchError) {
      console.error("Exception during FAQ fetch:", faqFetchError.message);
      setGeneralFAQs([]);
      toast({
        title: "FAQ Loading Issue",
        description: "There was an issue loading FAQs: " + faqFetchError.message,
        variant: "default",
      });
    } finally {
      setFaqsLoading(false);
    }
  }, [productId, navigate, toast]);

  const fetchRelatedProductsData = useCallback(async (currentProduct) => {
    if (!currentProduct || !currentProduct.category) return;
    try {
      const data = await api.get(`/products?category=${encodeURIComponent(currentProduct.category)}&limit=5`);
      const all = data.products || data || [];
      // Exclude the current product
      const related = all.filter(p => p.id !== currentProduct.id).slice(0, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error("Error fetching related products:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchProductAndFAQsData();
  }, [fetchProductAndFAQsData]);

  useEffect(() => {
    if (product) {
      fetchRelatedProductsData(product);
    } else {
      setRelatedProducts([]);
    }
  }, [product, fetchRelatedProductsData]);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setCurrentPrice(size.price);
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast({ title: "Error", description: "Product data is not available.", variant: "destructive" });
      return;
    }
    if (sizes && sizes.length > 0 && !selectedSize) {
      toast({ title: "Select Size", description: "Please select a size before adding to cart.", variant: "destructive" });
      return;
    }
    try {
      await addToCart(product, selectedSize);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error Adding to Cart", description: error.message || "Failed to add item to cart. Please try again.", variant: "destructive" });
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) {
      toast({ title: "Error", description: "Product data is not available.", variant: "destructive" });
      return;
    }
    try {
      await toggleWishlist(product);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({ title: "Error Updating Wishlist", description: error.message || "Failed to update wishlist. Please try again.", variant: "destructive" });
    }
  };

  return {
    product,
    sizes,
    selectedSize,
    currentPrice,
    relatedProducts,
    generalFAQs,
    loading: productLoading || faqsLoading,
    productLoading,
    faqsLoading,
    handleSizeSelect,
    handleAddToCart,
    handleToggleWishlist,
    isInWishlist: currentProductIsInWishlist,
    productId,
  };
};
