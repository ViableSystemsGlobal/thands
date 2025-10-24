import { useState, useEffect, useContext, createContext } from 'react';
import { authApi } from '@/lib/services/authApi';
import { useToast } from '@/components/ui/use-toast';

// Create Admin Auth Context (separate from customer auth)
const AdminAuthContext = createContext();

// Admin Auth Provider Component
export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Initialize admin auth state on mount
  useEffect(() => {
    initializeAdminAuth();
  }, []);

  const initializeAdminAuth = async () => {
    try {
      // Check for admin token specifically
      let adminToken = null;
      let storedAdminUser = null;
      
      try {
        adminToken = localStorage.getItem('admin_auth_token');
        storedAdminUser = localStorage.getItem('admin_user');
      } catch (storageError) {
        console.warn('🔐 useAdminAuth: localStorage access denied:', storageError);
        // Clear any partial data and continue without stored auth
        clearAdminAuth();
        setLoading(false);
        return;
      }
      
      console.log('🔐 useAdminAuth: Initializing admin auth');
      console.log('🔐 useAdminAuth: Admin token exists:', !!adminToken);
      console.log('🔐 useAdminAuth: Admin user exists:', !!storedAdminUser);

      if (adminToken && storedAdminUser) {
        try {
          console.log('🔐 useAdminAuth: Verifying admin token...');
          // Verify admin token is still valid
          const response = await authApi.verifyToken(adminToken);
          console.log('✅ useAdminAuth: Token verification response:', response);
          
          // Only set as authenticated if user has admin privileges
          const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
          if (adminRoles.includes(response.user?.role)) {
            setAdminUser(response.user);
            setIsAuthenticated(true);
          } else {
            // Not an admin, clear admin data
            clearAdminAuth();
          }
        } catch (error) {
          console.error('❌ useAdminAuth: Token verification failed:', error);
          // Token is invalid, clear stored data
          clearAdminAuth();
        }
      } else {
        console.log('🔐 useAdminAuth: No admin token or user found, not authenticated');
      }
    } catch (error) {
      console.error('❌ useAdminAuth: Admin auth initialization error:', error);
      clearAdminAuth();
    } finally {
      setLoading(false);
    }
  };

  const clearAdminAuth = () => {
    try {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
    } catch (storageError) {
      console.warn('🔐 useAdminAuth: Error clearing localStorage:', storageError);
    }
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 useAdminAuth: Attempting admin login for:', email);
      const response = await authApi.adminLogin(email, password);
      console.log('✅ useAdminAuth: Admin login response:', response);
      
      // Verify this is an admin user
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!adminRoles.includes(response.user?.role)) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Store admin auth data separately
      try {
        localStorage.setItem('admin_auth_token', response.token);
        localStorage.setItem('admin_user', JSON.stringify(response.user));
      } catch (storageError) {
        console.warn('🔐 useAdminAuth: Error storing auth data:', storageError);
        // Continue without storing - user will need to login again on refresh
      }
      
      console.log('✅ useAdminAuth: Admin token stored in localStorage');
      console.log('✅ useAdminAuth: Admin user stored in localStorage');
      
      // Update state
      setAdminUser(response.user);
      setIsAuthenticated(true);
      console.log('✅ useAdminAuth: Admin authentication successful');
      
      toast({
        title: "Admin Login Successful",
        description: `Welcome back, ${response.user.firstName}!`,
      });

      return response;
    } catch (error) {
      console.error('❌ useAdminAuth: Admin login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Admin login failed';
      console.error('❌ useAdminAuth: Error message:', errorMessage);
      toast({
        title: "Admin Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    clearAdminAuth();
    
    toast({
      title: "Admin Logged Out",
      description: "You have been successfully logged out from admin panel.",
    });
  };

  const updateAdminProfile = async (profileData) => {
    try {
      const adminToken = localStorage.getItem('admin_auth_token');
      const response = await authApi.updateProfile(profileData, adminToken);
      
      // Update stored admin user data
      const updatedAdminUser = { ...adminUser, ...response.user };
      localStorage.setItem('admin_user', JSON.stringify(updatedAdminUser));
      
      // Update state
      setAdminUser(updatedAdminUser);
      
      toast({
        title: "Admin Profile Updated",
        description: "Your admin profile has been updated successfully.",
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Admin profile update failed';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshAdminUser = async () => {
    try {
      const adminToken = localStorage.getItem('admin_auth_token');
      const response = await authApi.getProfile(adminToken);
      const updatedAdminUser = response.user;
      
      // Only update if still admin
      if (updatedAdminUser?.role === 'admin') {
        // Update stored admin user data
        localStorage.setItem('admin_user', JSON.stringify(updatedAdminUser));
        
        // Update state
        setAdminUser(updatedAdminUser);
        
        return updatedAdminUser;
      } else {
        // No longer admin, logout
        adminLogout();
        throw new Error('Admin privileges revoked');
      }
    } catch (error) {
      console.error('Admin user refresh error:', error);
      // If refresh fails, admin might need to re-login
      adminLogout();
      throw error;
    }
  };

  const value = {
    user: adminUser, // Keep same interface as customer auth
    loading,
    isAuthenticated,
    login: adminLogin, // Keep same interface
    logout: adminLogout, // Keep same interface
    updateProfile: updateAdminProfile,
    refreshUser: refreshAdminUser,
    // Admin-specific methods
    adminLogin,
    adminLogout,
    updateAdminProfile,
    refreshAdminUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Hook to use admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default useAdminAuth;
