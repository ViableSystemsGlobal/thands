
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ShopFilters = ({
  categories,
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onApplyFilters,
  onClearFilters,
  show,
}) => {
  const filterPanelVariants = {
    hidden: { opacity: 0, height: 0, y: -20 },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, height: 0, y: -20, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={filterPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mb-8 p-6 border border-gray-200 rounded-xl bg-white shadow-md overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="categories-filter" className="text-sm font-medium text-gray-700 mb-1 block">Categories</Label>
              <MultiSelect
                id="categories-filter"
                options={categories.map(cat => ({ label: cat, value: cat }))}
                selected={selectedCategories}
                onChange={onCategoryChange}
                className="w-full"
                placeholder="Select categories..."
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Price Range (USD)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => onPriceChange('min', e.target.value)}
                  className="w-full"
                  aria-label="Minimum price"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => onPriceChange('max', e.target.value)}
                  className="w-full"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600"
            >
              <X className="h-4 w-4 mr-2" /> Clear Filters
            </Button>
            <Button 
              onClick={onApplyFilters}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShopFilters;
