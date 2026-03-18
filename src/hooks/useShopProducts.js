import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

const PRODUCTS_PER_PAGE = 8;

const useShopProducts = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAllCategories = useCallback(async () => {
    try {
      const data = await api.get('/products/categories/list');
      const categories = data.categories || data || [];
      setAllCategories(categories);
      return categories;
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
      return [];
    }
  }, [toast]);

  const fetchProducts = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true);
    setCurrentPage(page);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', PRODUCTS_PER_PAGE);

      if (searchQuery && searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const categoriesFilter = searchParams.getAll('category');
      if (categoriesFilter.length > 0) {
        categoriesFilter.forEach(cat => queryParams.append('category', cat));
      }

      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      if (minPrice) queryParams.set('minPrice', minPrice);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);

      const sortOption = searchParams.get('sort') || 'newest';
      queryParams.set('sort', sortOption);

      const data = await api.get(`/products?${queryParams.toString()}`);

      let fetchedProducts = data.products || data || [];
      const total = data.total || fetchedProducts.length;

      // Client-side price sort if needed (backend may not support it)
      if (sortOption === 'price_asc' || sortOption === 'price_desc') {
        fetchedProducts = [...fetchedProducts].sort((a, b) => {
          const priceA = a.product_sizes?.[0]?.price || 0;
          const priceB = b.product_sizes?.[0]?.price || 0;
          return sortOption === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
      }

      setProducts(fetchedProducts);
      setTotalPages(Math.ceil(total / PRODUCTS_PER_PAGE));

    } catch (err) {
      console.error("Error fetching products:", err);
      toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
      setProducts([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [toast, searchParams]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    fetchProducts(1, searchQuery);
  }, [searchParams, fetchProducts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const searchQuery = searchParams.get('search') || '';
      fetchProducts(newPage, searchQuery);
    }
  };

  return {
    products,
    allCategories,
    loading,
    currentPage,
    totalPages,
    handlePageChange,
    fetchAllCategories,
    fetchProducts,
  };
};

export default useShopProducts;
