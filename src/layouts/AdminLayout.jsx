import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminBranchProvider } from '@/context/AdminBranchContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { useToast } from '@/components/ui/use-toast';

const AdminLayout = () => {
  const { isAuthenticated, loading, user, logout } = useAdminAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple refs for toast management
  const toastShownRef = useRef({ access: false, login: false });

  // Check if user has admin privileges
  const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
  const isAdmin = adminRoles.includes(user?.role);

  // Handle access denied toast
  useEffect(() => {
    if (isAuthenticated && !isAdmin && 
        location.pathname !== "/admin/login" && !toastShownRef.current.access) {
      toastShownRef.current.access = true;
      toast({
        title: "Access Denied",
        description: "You do not have administrator privileges.",
        variant: "destructive",
      });
    }
    
    if (!isAuthenticated || isAdmin) {
      toastShownRef.current.access = false;
    }
  }, [isAuthenticated, isAdmin, location.pathname, toast]);

  // Handle login required toast
  useEffect(() => {
    if (location.pathname !== "/admin/login" && 
        !loading && !isAuthenticated &&
        !toastShownRef.current.login) {
      
      toastShownRef.current.login = true;
      toast({
        title: "Access Required", 
        description: "Please log in to access the admin panel.",
        variant: "destructive",
      });
    }
    
    if (isAuthenticated || location.pathname === "/admin/login") {
      toastShownRef.current.login = false;
    }
  }, [loading, isAuthenticated, location.pathname, toast]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSidebarLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      // Reset refs
      toastShownRef.current = { access: false, login: false };
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500 mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-white mb-2">Authenticating...</h1>
          <p className="text-sky-300">Please wait.</p>
          <div className="mt-6">
            <p className="text-sky-400 text-sm mb-4">Taking too long?</p>
            <button 
              onClick={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            >
              Reset & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated and admin, show admin panel
  if (isAuthenticated && isAdmin) {
    return (
      <AdminBranchProvider>
        <div className="flex h-screen bg-slate-100">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <AdminSidebar 
              onLogout={handleLogout}
              onLinkClick={handleSidebarLinkClick}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="relative w-64 h-full">
                <AdminSidebar 
                  onLogout={handleLogout}
                  onLinkClick={handleSidebarLinkClick}
                />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminNavbar onMobileMenuToggle={handleMobileMenuToggle} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100">
              <Outlet />
            </main>
          </div>
        </div>
      </AdminBranchProvider>
    );
  }

  // If user is authenticated but not admin, redirect to login
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If on login page, allow it to render
  if (location.pathname === "/admin/login") {
    return <Outlet />; 
  }

  // For any other case (IDLE, not authenticated), redirect to login
  return <Navigate to="/admin/login" state={{ from: location }} replace />;
};

export default AdminLayout;
