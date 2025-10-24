
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useShop } from "@/context/ShopContext";

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

const DesktopRTWDropdown = () => {
  const navigate = useNavigate();
  const { setSearchQuery } = useShop();

  const handleRTWItemClick = (searchTerm) => {
    setSearchQuery(searchTerm);
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-1 hover:text-gray-600 transition-colors tracking-wide">
        <span>RTW</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[800px] p-6">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-1 pr-8 border-r">
            <h3 className="text-lg font-medium mb-2">Ready To Wear</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Explore our curated collection of ready-to-wear pieces, featuring contemporary African-inspired designs crafted for immediate wear.
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-8">
            {Object.entries(rtwCategories).map(([category, items]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-medium text-sm text-gray-500">{category}</h3>
                <div className="space-y-1">
                  {Object.entries(items).map(([name, searchTerm]) => (
                    <DropdownMenuItem key={searchTerm} className="px-0">
                      <button
                        onClick={() => handleRTWItemClick(searchTerm)}
                        className="w-full text-left hover:translate-x-1 transition-transform"
                      >
                        {name}
                      </button>
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-1">
            <div className="aspect-[3/4] overflow-hidden rounded-lg">
              <img  
                className="w-full h-full object-cover"
                alt="Featured RTW collection"
               src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/27bd76939a74c296a8c4298e7d5627dc.png" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">New Arrivals</p>
              <p className="text-xs text-gray-500 mt-1">SS25 Collection</p>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DesktopRTWDropdown;
