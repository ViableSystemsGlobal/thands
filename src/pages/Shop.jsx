
import React, { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useShop } from "@/context/ShopContext";
import { useToast } from "@/components/ui/use-toast";
import SizeSelectionDialog from "@/components/shop/SizeSelectionDialog";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFilters from "@/components/shop/ShopFilters";
import ProductGrid from "@/components/shop/ProductGridApi";
import ShopPagination from "@/components/shop/ShopPagination";
import useShopFilters from "@/hooks/useShopFilters";
import useShopProducts from "@/hooks/useShopProductsApi";

const Shop = () => {
  const { addToCart } = useShop();
  const { toast } = useToast();

  const { 
    products, 
    allCategories, 
    loading: productsLoading, 
    currentPage, 
    totalPages, 
    handlePageChange,
    fetchAllCategories,
    fetchProducts,
  } = useShopProducts();

  const {
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
    setAvailableCategories,
  } = useShopFilters(allCategories);

  useEffect(() => {
    setAvailableCategories(allCategories);
  }, [allCategories]);
  
  useEffect(() => {
    fetchAllCategories();
  }, []);


  const [selectedProductForDialog, setSelectedProductForDialog] = React.useState(null);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);

  const handleOpenAddToCartDialog = useCallback((product) => {
    setSelectedProductForDialog(product);
    setIsSizeDialogOpen(true);
  }, []);

  const handleSizeSelectedForCart = useCallback(async (size) => {
    if (selectedProductForDialog && size) {
      setIsAddingToCart(true);
      try {
        await addToCart(selectedProductForDialog, size);
        toast({ title: "Added to Cart", description: `${selectedProductForDialog.name} (${size.size}) added successfully.` });
        setIsSizeDialogOpen(false);
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" });
      } finally {
        setIsAddingToCart(false);
        setSelectedProductForDialog(null);
      }
    }
  }, [selectedProductForDialog, addToCart, toast]);

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="pt-16 pb-16 bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ShopHeader
          showFilters={showFiltersPanel}
          onToggleFilters={toggleFiltersPanel}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortOption={sortOption}
          onSortChange={handleSortChange}
        />



        <ShopFilters
          show={showFiltersPanel}
          categories={allCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          priceRange={priceRange}
          onPriceChange={handlePriceChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />
        
        <ProductGrid
          products={products}
          loading={productsLoading}
          onAddToCart={handleOpenAddToCartDialog}
        />

        <ShopPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {selectedProductForDialog && (
          <SizeSelectionDialog
            open={isSizeDialogOpen}
            onOpenChange={setIsSizeDialogOpen}
            product={selectedProductForDialog}
            onSizeSelect={handleSizeSelectedForCart}
            loading={isAddingToCart}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Shop;
