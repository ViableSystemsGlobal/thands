
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingCart, MessageCircle, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/context/ShopContext';
import { useCartState } from '@/context/ShopContext/cartState';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import CartDrawer from '@/components/cart/CartDrawer';

const BottomMobileNav = () => {
  const { user } = useAuth();
  const { cart, wishlist } = useShop();
  const { cartItemsCount } = useCartState(cart || []);
  const navigate = useNavigate();
  const location = useLocation();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      action: () => navigate('/'),
      path: '/',
      activePaths: ['/'],
    },
    {
      icon: Heart,
      label: 'Wishlist',
      action: () => navigate('/wishlist'),
      path: '/wishlist',
      activePaths: ['/wishlist'],
      badge: wishlist && wishlist.length > 0 ? wishlist.length : null,
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      action: () => setCartDrawerOpen(true),
      path: '/cart',
      activePaths: ['/cart', '/checkout'],
      badge: cartItemsCount > 0 ? cartItemsCount : null,
    },
    {
      icon: MessageCircle,
      label: 'Chat',
      action: () => {
        // Toggle chat - this will be handled by ChatbotWebSocket
        setIsChatOpen(!isChatOpen);
        // Dispatch custom event to open chat
        window.dispatchEvent(new CustomEvent('openChat'));
      },
      path: null,
      activePaths: [],
      isChat: true,
    },
    {
      icon: User,
      label: 'Profile',
      action: () => navigate(user ? '/account' : '/login'),
      path: user ? '/account' : '/login',
      activePaths: ['/account', '/login', '/signup', '/orders'],
    },
  ];

  const isActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    return item.activePaths.some(p => location.pathname.startsWith(p));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-top-nav p-2 md:hidden z-40">
      <div className="container mx-auto px-2">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                'flex flex-col items-center justify-center text-xs font-medium w-1/5 relative transition-colors duration-200 ease-in-out rounded-md p-1',
                isActive(item) || (item.isChat && isChatOpen)
                  ? 'text-[#D2B48C] dark:text-[#D2B48C]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#D2B48C] dark:hover:text-[#D2B48C]'
              )}
            >
              <item.icon className="h-5 w-5 mb-0.5" strokeWidth={(isActive(item) || (item.isChat && isChatOpen)) ? 2.5 : 2} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-0.5 bg-[#D2B48C] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </nav>
  );
};

export default BottomMobileNav;
