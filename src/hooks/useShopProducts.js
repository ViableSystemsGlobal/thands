
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      setAllCategories(uniqueCategories);
      return uniqueCategories;
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
      let query = supabase
        .from('products')
        .select('*, product_sizes(*)', { count: 'exact' });

      // Apply search first - simple and direct
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const categoriesFilter = searchParams.getAll('category');
      if (categoriesFilter.length > 0) {
        query = query.in('category', categoriesFilter);
      }

      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      
      if (minPrice || maxPrice) {
        const productIdsWithMatchingSizes = await supabase
          .from('product_sizes')
          .select('product_id')
          .gte('price', minPrice || 0)
          .lte('price', maxPrice || Infinity);

        if (productIdsWithMatchingSizes.error) throw productIdsWithMatchingSizes.error;
        
        const pIds = productIdsWithMatchingSizes.data.map(ps => ps.product_id);
        if (pIds.length > 0) {
          query = query.in('id', pIds);
        } else {
          query = query.eq('id', -1); // No products match price range
        }
      }

      const sortOption = searchParams.get('sort') || 'newest';
      if (sortOption === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortOption === 'oldest') query = query.order('created_at', { ascending: true });
      else if (sortOption === 'name_asc') query = query.order('name', { ascending: true });
      else if (sortOption === 'name_desc') query = query.order('name', { ascending: false });

      const { data, error, count } = await query.range((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE - 1);

      if (error) throw error;
      
      let sortedData = data || [];
      if (sortOption === 'price_asc' || sortOption === 'price_desc') {
        sortedData.sort((a, b) => {
          const priceA = a.product_sizes?.[0]?.price || 0;
          const priceB = b.product_sizes?.[0]?.price || 0;
          return sortOption === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
      }

      setProducts(sortedData);
      setTotalPages(Math.ceil((count || 0) / PRODUCTS_PER_PAGE));

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
    fetchProducts(1, searchQuery); // Always start from page 1 when search changes
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
