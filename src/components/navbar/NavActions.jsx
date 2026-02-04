
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, User, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import BranchSelector from "@/components/navbar/BranchSelector";
// Currency selector moved to FloatingRegionSelector
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useShop } from "@/context/ShopContext";
import { useCartState } from "@/context/ShopContext/cartState";
import CartDrawer from "@/components/cart/CartDrawer";

const NavActions = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, wishlist } = useShop();
  const { cartItemsCount } = useCartState(cart || []);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <BranchSelector />
      {/* Currency selector moved to FloatingRegionSelector */}
      {/* Desktop Nav Actions - Hidden on mobile, shown on md and up */}
      <div className="hidden md:flex items-center space-x-1">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user ? (
              <>
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account?tab=orders")}>
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Login
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/signup")}>
                  Sign Up
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/wishlist">
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Heart className="h-5 w-5" />
            {wishlist && wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D2B48C] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => setCartDrawerOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D2B48C] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </Button>
      </div>

      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </div>
  );
};

export default NavActions;
