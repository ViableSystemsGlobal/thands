import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FloatingRegionSelector = () => {
  const { currency, setCurrency } = useCurrency();
  const { branchCode } = useBranch();

  // Get the currency symbol based on selected currency
  const getCurrencySymbol = () => {
    switch (currency) {
      case 'GHS':
        return '₵';
      case 'GBP':
        return '£';
      case 'USD':
      default:
        return '$';
    }
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {/* Currency Selector Only */}
      <div className="bg-white/95 backdrop-blur-md border-l border-t border-b border-gray-200/80 rounded-l-lg shadow-xl p-1.5 md:p-2 flex items-center gap-1 md:gap-1.5 min-w-[100px] md:min-w-[120px] hover:shadow-2xl transition-shadow">
        <span className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 flex-shrink-0 text-xs md:text-sm font-medium">
          {getCurrencySymbol()}
        </span>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-full h-6 md:h-7 text-xs border-0 shadow-none focus:ring-0 bg-transparent py-0">
            <SelectValue>{currency}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="GHS">GHS (₵)</SelectItem>
            <SelectItem value="GBP">GBP (£)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FloatingRegionSelector;

