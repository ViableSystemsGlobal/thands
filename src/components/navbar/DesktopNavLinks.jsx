
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gift } from 'lucide-react';
import DesktopRTWDropdown from "@/components/navbar/DesktopRTWDropdown";
import { cn } from '@/lib/utils';

const DesktopNavLinks = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/shop') {
      return location.pathname === '/shop' || location.pathname.startsWith('/product/');
    }
    return location.pathname === path;
  };

  return (
    <div className="hidden md:flex space-x-8">
      <Link 
        to="/shop" 
        className={cn(
          "transition-colors tracking-wide",
          isActive('/shop') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
      >
        Shop
      </Link>
      
      <DesktopRTWDropdown />

      <Link 
        to="/consultation" 
        className={cn(
          "transition-colors tracking-wide",
          isActive('/consultation') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
      >
        Bespoke
      </Link>

      <Link 
        to="/gift-vouchers" 
        className={cn(
          "transition-colors tracking-wide flex items-center space-x-1",
          isActive('/gift-vouchers') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
      >
        <Gift className="h-4 w-4" />
        <span>Gift Vouchers</span>
      </Link>

      <Link 
        to="/about" 
        className={cn(
          "transition-colors tracking-wide",
          isActive('/about') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
      >
        About
      </Link>
      
      <Link 
        to="/contact" 
        className={cn(
          "transition-colors tracking-wide",
          isActive('/contact') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
      >
        Contact
      </Link>
    </div>
  );
};

export default DesktopNavLinks;
