
import React, { useState } from "react";
import NavLogo from "@/components/navbar/NavLogo";
import DesktopNavLinks from "@/components/navbar/DesktopNavLinks";
import NavActions from "@/components/navbar/NavActions";
import MobileMenuSheet from "@/components/navbar/MobileMenuSheet";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleMobileNavNavigate = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center md:space-x-4">
            <MobileMenuSheet 
              isOpen={isMobileMenuOpen} 
              onOpenChange={setIsMobileMenuOpen} 
              onNavigate={handleMobileNavNavigate} 
            />
            <NavLogo />
          </div>
          
          <DesktopNavLinks />
          
          <NavActions />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
