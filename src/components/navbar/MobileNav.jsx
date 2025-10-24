
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "@/context/ShopContext";
import { cn } from '@/lib/utils';

const rtwCategories = {
  "Traditional": {
    "Kaftans": "kaftan",
    "Agbada": "agbada",
    "Casual Wear": "casual"
  },
  "Modern": {
    "Short-Sleeve": "short-sleeve",
    "Long-Sleeve": "long-sleeve",
    "Sets": "matching sets"
  }
};

const MobileNav = ({ onNavigate }) => {
  const [isRTWOpen, setIsRTWOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery } = useShop();

  const handleNavigation = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  const handleRTWItemClick = (searchTerm) => {
    setSearchQuery(searchTerm);
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
    if (onNavigate) onNavigate();
  };

  const isActive = (path) => {
    if (path === '/shop') {
      return location.pathname === '/shop' || location.pathname.startsWith('/product/');
    }
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col space-y-6 pt-6 h-[calc(100vh-80px)] overflow-y-auto">
      <Link 
        to="/shop" 
        className={cn(
          "text-xl tracking-wide transition-colors",
          isActive('/shop') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
        onClick={() => handleNavigation("/shop")}
      >
        Shop
      </Link>

      <div className="space-y-4">
        <button
          onClick={() => setIsRTWOpen(!isRTWOpen)}
          className="flex items-center justify-between w-full text-xl tracking-wide hover:text-[#D2B48C] transition-colors"
        >
          <span>RTW</span>
          <ChevronRight className={`h-5 w-5 transition-transform ${isRTWOpen ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {isRTWOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-4 space-y-6 mb-4">
                <div className="space-y-4 border-l border-gray-200 pl-4">
                  <p className="text-sm text-gray-500">Ready To Wear</p>
                  <p className="text-sm text-gray-600">
                    Explore our curated collection of ready-to-wear pieces, featuring contemporary African-inspired designs crafted for immediate wear.
                  </p>
                </div>
                {Object.entries(rtwCategories).map(([category, items]) => (
                  <div key={category} className="space-y-3 border-l border-gray-200 pl-4">
                    <h4 className="text-sm font-medium text-gray-500">{category}</h4>
                    <div className="space-y-2">
                      {Object.entries(items).map(([name, searchTerm]) => (
                        <button
                          key={searchTerm}
                          onClick={() => handleRTWItemClick(searchTerm)}
                          className="block text-sm hover:text-[#D2B48C] transition-colors w-full text-left"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link 
        to="/consultation" 
        className={cn(
          "text-xl tracking-wide transition-colors",
          isActive('/consultation') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
        onClick={() => handleNavigation("/consultation")}
      >
        Bespoke
      </Link>

      <Link 
        to="/gift-vouchers" 
        className={cn(
          "text-xl tracking-wide transition-colors",
          isActive('/gift-vouchers') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
        onClick={() => handleNavigation("/gift-vouchers")}
      >
        Gift Vouchers
      </Link>

      <Link 
        to="/about" 
        className={cn(
          "text-xl tracking-wide transition-colors",
          isActive('/about') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
        onClick={() => handleNavigation("/about")}
      >
        About
      </Link>
      
      <Link 
        to="/contact" 
        className={cn(
          "text-xl tracking-wide transition-colors",
          isActive('/contact') 
            ? "text-[#D2B48C] font-medium" 
            : "hover:text-[#D2B48C]"
        )}
        onClick={() => handleNavigation("/contact")}
      >
        Contact
      </Link>
    </div>
  );
};

export default MobileNav;
