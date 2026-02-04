import React, { useState } from 'react';
import { useBranch } from '@/context/BranchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Globe } from 'lucide-react';

// Get currency context from window (set by CurrencyProvider)
const getCurrencyContext = () => {
  if (typeof window !== 'undefined' && window.__currencyContext) {
    return window.__currencyContext;
  }
  return null;
};

const BranchSelector = ({ className = "" }) => {
  const { branchCode, availableBranches, setBranch, loading, forceRedetection } = useBranch();
  const [isChanging, setIsChanging] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleBranchChange = async (newBranchCode) => {
    // Check if we're trying to select the same branch (accounting for international)
    const isCurrentlyInternational = typeof window !== 'undefined' && 
      localStorage.getItem('branch_is_international') === 'true';
    
    // If selecting a branch that's already selected (and not international), skip
    // But allow changing from International (which uses US) to actual US branch
    if (newBranchCode === branchCode && !isCurrentlyInternational) return;
    
    // Allow changing from International to any branch (including US)
    // This allows switching from International (US branch) to actual US branch
    
    // Special case: detect location
    if (newBranchCode === 'DETECT') {
      setIsDetecting(true);
      try {
        await forceRedetection();
        // Reload page to apply branch context throughout the app
        window.location.reload();
      } catch (error) {
        console.error('Error detecting location:', error);
      } finally {
        setIsDetecting(false);
      }
      return;
    }
    
    // Special case: International
    if (newBranchCode === 'INT') {
      setIsChanging(true);
      try {
        // Use US branch settings but set currency to USD explicitly
        await setBranch('US', true);
        const currencyContext = getCurrencyContext();
        if (currencyContext) {
          console.log('💵 Setting currency to USD for International');
          currencyContext.setCurrency('USD');
        }
        // Store that this is international selection
        if (typeof window !== 'undefined') {
          localStorage.setItem('branch_is_international', 'true');
        }
        // Reload page to apply branch context throughout the app
        window.location.reload();
      } catch (error) {
        console.error('Error setting international branch:', error);
      } finally {
        setIsChanging(false);
      }
      return;
    }
    
    setIsChanging(true);
    try {
      // Clear international flag if selecting a specific branch
      if (typeof window !== 'undefined') {
        localStorage.removeItem('branch_is_international');
      }
      await setBranch(newBranchCode);
      // Reload page to apply branch context throughout the app
      window.location.reload();
    } catch (error) {
      console.error('Error changing branch:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Branch display names with flags
  // For dropdown items, always show the actual branch name (not "Int'l")
  const getBranchDisplay = (code) => {
    const flags = {
      'GH': '🇬🇭',
      'UK': '🇬🇧',
      'US': '🇺🇸'
    };
    
    const names = {
      'GH': 'Ghana',
      'UK': 'UK',
      'US': 'USA'
    };
    
    return `${flags[code] || ''} ${names[code] || code}`;
  };

  // For the trigger display, show "Int'l" if international is selected
  const getTriggerDisplay = () => {
    if (isInternational) {
      return '🌍 Int\'l';
    }
    return getBranchDisplay(branchCode);
  };

  if (loading || availableBranches.length === 0) {
    return null;
  }

  // Check if international is selected
  const isInternational = typeof window !== 'undefined' && 
    localStorage.getItem('branch_is_international') === 'true';
  
  const selectValue = isInternational ? 'INT' : branchCode;

  return (
    <div className={`flex items-center ${className}`}>
      <Select
        value={selectValue}
        onValueChange={handleBranchChange}
        disabled={isChanging}
      >
        <SelectTrigger className="w-[140px] md:w-[160px] h-8 md:h-9 text-xs md:text-sm border-gray-200 hover:border-gray-300 bg-white">
          {isChanging || isDetecting ? (
            <span className="text-xs md:text-sm text-gray-600">
              {isDetecting ? 'Detecting...' : 'Changing...'}
            </span>
          ) : (
            <SelectValue>
              {getTriggerDisplay()}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DETECT" className="text-blue-600 font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Detect my location</span>
            </div>
          </SelectItem>
          {availableBranches.map((branch) => (
            <SelectItem key={branch.branch_code} value={branch.branch_code}>
              <div className="flex items-center gap-2">
                <span>{getBranchDisplay(branch.branch_code)}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="INT" className="text-gray-700">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>🌍 Int'l</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BranchSelector;

