import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Eye,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AdminNavbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications, total } = useNotifications();

  const handleViewWebsite = () => {
    // Open main website in new tab
    window.open('/', '_blank');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality here
      console.log('Searching for:', searchQuery);
      // You can implement global admin search logic here
      // For example, search across products, orders, customers, etc.
    }
  };

  const userInitials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Mobile menu toggle and search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile menu toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products, orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Right side - Actions and profile */}
        <div className="flex items-center space-x-3">
          {/* View Website Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewWebsite}
            className="hidden sm:flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            <span>View Website</span>
          </Button>

          {/* Mobile View Website Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewWebsite}
            className="sm:hidden"
          >
            <Eye className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {total > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {total > 99 ? '99+' : total}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">
                Notifications {total > 0 && <span className="text-muted-foreground font-normal">({total})</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={`${n.type}-${n.id}`}
                    className="flex items-start gap-3 py-3 cursor-pointer"
                    onClick={() => navigate(n.path)}
                  >
                    <div className="mt-0.5 flex-shrink-0 text-muted-foreground">
                      {n.type === 'order' ? (
                        <ShoppingBag className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {timeAgo(n.time)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-sm text-indigo-600 font-medium"
                onClick={() => navigate('/admin/orders')}
              >
                View all orders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${userInitials}`}
                    alt={user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'Admin'}
                  />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Administrator'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'admin@tailoredhands.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar; 