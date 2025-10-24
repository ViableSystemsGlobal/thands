
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';

const useShopFilters = (initialCategories = []) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setSearchQuery: setGlobalSearchQuery } = useShop();

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.getAll('category') || []
  );
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [searchQuery, setSearchQueryState] = useState(searchParams.get('search') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');
  
  const [availableCategories, setAvailableCategories] = useState(initialCategories);

  useEffect(() => {
    setAvailableCategories(initialCategories);
  }, [initialCategories]);

  const updateSearchParams = useCallback((skipSearchQuery = false) => {
    const params = new URLSearchParams();
    selectedCategories.forEach(cat => params.append('category', cat));
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (searchQuery && !skipSearchQuery) params.set('search', searchQuery);
    if (sortOption) params.set('sort', sortOption);
    setSearchParams(params, { replace: true });
  }, [selectedCategories, priceRange, searchQuery, sortOption, setSearchParams]);

  const handleCategoryChange = useCallback((newSelectedCategories) => {
    setSelectedCategories(newSelectedCategories);
  }, []);

  const handlePriceChange = useCallback((key, value) => {
    setPriceRange(prev => ({ ...prev, [key]: value }));
  }, []);

  // Simplified search - update immediately
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQueryState(query);
    setGlobalSearchQuery(query);
    
    // Update URL immediately
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params, { replace: true });
  }, [setGlobalSearchQuery, searchParams, setSearchParams]);

  const handleSortChange = useCallback((value) => {
    setSortOption(value);
    // Update URL params immediately for sort
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const applyFilters = useCallback(() => {
    // Filters are now auto-applied via useEffect
    // This function can be used for manual application if needed
    updateSearchParams();
  }, [updateSearchParams]);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setSearchQueryState('');
    setGlobalSearchQuery('');
    setSortOption('newest');
    setSearchParams({}, { replace: true });
  }, [setSearchParams, setGlobalSearchQuery]);
  
  const toggleFiltersPanel = useCallback(() => {
    setShowFiltersPanel(prev => !prev);
  }, []);

  // Sync state from URL changes (for RTW navigation and manual filter changes)
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    const categoriesFromUrl = searchParams.getAll('category') || [];
    const minPriceFromUrl = searchParams.get('minPrice') || '';
    const maxPriceFromUrl = searchParams.get('maxPrice') || '';
    const sortFromUrl = searchParams.get('sort') || 'newest';
    
    // Only update state if it's different from current state to prevent loops
    if (searchFromUrl !== searchQuery) {
      setSearchQueryState(searchFromUrl);
      setGlobalSearchQuery(searchFromUrl);
    }
    if (JSON.stringify(categoriesFromUrl) !== JSON.stringify(selectedCategories)) {
      setSelectedCategories(categoriesFromUrl);
    }
    if (minPriceFromUrl !== priceRange.min || maxPriceFromUrl !== priceRange.max) {
      setPriceRange({ min: minPriceFromUrl, max: maxPriceFromUrl });
    }
    if (sortFromUrl !== sortOption) {
      setSortOption(sortFromUrl);
    }
  }, [searchParams, setGlobalSearchQuery, searchQuery, selectedCategories, priceRange, sortOption]);

  return {
    showFiltersPanel,
    toggleFiltersPanel,
    selectedCategories,
    handleCategoryChange,
    priceRange,
    handlePriceChange,
    searchQuery,
    handleSearchChange,
    sortOption,
    handleSortChange,
    applyFilters,
    clearFilters,
    availableCategories,
    setAvailableCategories,
  };
};

export default useShopFilters;
