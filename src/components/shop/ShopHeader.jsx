
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const ShopHeader = ({
  showFilters,
  onToggleFilters,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
      <Button
        variant="outline"
        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all w-full md:w-auto"
        onClick={onToggleFilters}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="font-medium">{showFilters ? "Hide Filters" : "Show Filters"}</span>
      </Button>

      <div className="flex-grow w-full md:w-auto">
        <Input
          type="search"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={onSearchChange}
          className="max-w-md border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500 transition-all"
          aria-label="Search products"
        />
      </div>

      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger className="w-full md:w-[200px] border-gray-300 bg-white text-gray-700 hover:border-gray-500 transition-all">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            <SelectValue placeholder="Sort by..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="price_asc">Price: Low to High</SelectItem>
          <SelectItem value="price_desc">Price: High to Low</SelectItem>
          <SelectItem value="name_asc">Name: A to Z</SelectItem>
          <SelectItem value="name_desc">Name: Z to A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ShopHeader;
