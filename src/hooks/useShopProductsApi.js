// New version of useShopProducts that uses our API instead of Supabase
import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/services/productsApi';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

const PRODUCTS_PER_PAGE = 8;

const useShopProductsApi = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await productsApi.fetchCategories();
      // Transform category objects to just names (strings) to match Supabase format
      const categoryNames = (response || []).map(cat => cat.name);
      setAllCategories(categoryNames);
      return categoryNames;
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
      const offset = (page - 1) * PRODUCTS_PER_PAGE;
      
      // Build query parameters
      const params = {
        limit: PRODUCTS_PER_PAGE,
        offset: offset,
        active: true
      };

      // Add search query
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      const categoriesFilter = searchParams.getAll('category');
      if (categoriesFilter.length > 0) {
        // For now, we'll filter on frontend since our API doesn't support multiple categories
        // Later we can enhance the backend to support this
      }

      // Add price filter
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      // Add sorting
      const sortOption = searchParams.get('sort') || 'newest';
      switch (sortOption) {
        case 'newest':
          params.sort = 'created_at_desc';
          break;
        case 'oldest':
          params.sort = 'created_at_asc';
          break;
        case 'name_asc':
          params.sort = 'name_asc';
          break;
        case 'name_desc':
          params.sort = 'name_desc';
          break;
        case 'price_asc':
          params.sort = 'price_asc';
          break;
        case 'price_desc':
          params.sort = 'price_desc';
          break;
        default:
          params.sort = 'created_at_desc';
      }

      const response = await productsApi.fetchProducts(params);
      
      let sortedData = response.products || [];
      
      // Apply category filter on frontend (temporary)
      if (categoriesFilter.length > 0) {
        sortedData = sortedData.filter(product => 
          categoriesFilter.includes(product.category)
        );
      }

      // Apply price sorting on frontend (temporary)
      if (sortOption === 'price_asc' || sortOption === 'price_desc') {
        sortedData.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return sortOption === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
      }

      setProducts(sortedData);
      setTotalPages(Math.ceil((response.pagination?.total || 0) / PRODUCTS_PER_PAGE));

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
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    fetchProducts(1, searchQuery); // Always start from page 1 when search changes
  }, [searchParams]);

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

export default useShopProductsApi;
