import { useState, useEffect, useContext, createContext } from 'react';
import { authApi } from '@/lib/services/authApi';
import { useToast } from '@/components/ui/use-toast';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = authApi.getToken();
      const storedUser = authApi.getStoredUser();

      if (token && storedUser) {
        // Verify token is still valid
        try {
          const response = await authApi.verifyToken();
          setUser(response.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear stored data
          authApi.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      
      // Store auth data
      authApi.setAuthData(response.user, response.token);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.firstName}!`,
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      
      // Store auth data
      authApi.setAuthData(response.user, response.token);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      toast({
        title: "Registration Successful",
        description: `Welcome to TailoredHands, ${response.user.firstName}!`,
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authApi.updateProfile(profileData);
      
      // Update stored user data
      const updatedUser = { ...user, ...response.user };
      authApi.setAuthData(updatedUser, authApi.getToken());
      
      // Update state
      setUser(updatedUser);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password change failed';
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      const updatedUser = response.user;
      
      // Update stored user data
      authApi.setAuthData(updatedUser, authApi.getToken());
      
      // Update state
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('User refresh error:', error);
      // If refresh fails, user might need to re-login
      logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
