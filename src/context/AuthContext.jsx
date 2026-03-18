import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';

export const AUTH_STATUS = {
  IDLE: 'IDLE',
  PENDING_ACTION: 'PENDING_ACTION',
  AUTHENTICATED: 'AUTHENTICATED',
  ERROR: 'ERROR'
};

const defaultAuthContextValue = {
  user: null,
  profile: null,
  isAdmin: false,
  isAuthenticatedUser: false,
  status: AUTH_STATUS.IDLE,
  signInWithEmail: async () => ({ success: false, error: { message: "Context not ready" } }),
  signUpWithEmail: async () => ({ success: false, error: { message: "Context not ready" } }),
  handleSignOut: async () => {},
  sendPasswordResetEmail: async () => ({ success: false, error: { message: "Context not ready" } }),
  updatePassword: async () => ({ success: false, error: { message: "Context not ready" } }),
  resetAuthState: () => {},
  triggerAuthentication: async () => {},
};

const AuthContext = createContext(defaultAuthContextValue);

export const useAuth = () => useContext(AuthContext);

const AuthProviderInternal = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [status, setStatus] = useState(AUTH_STATUS.IDLE);

  const { toast } = useToast();

  const authInProgressRef = useRef(false);
  const sessionCheckedRef = useRef(false);

  // Helper to set authenticated state from a user object returned by the API
  const applyUserSession = (userObj) => {
    setUser(userObj);
    setProfile(userObj);
    const determinedAdmin = userObj.role === 'admin';
    setIsAdmin(determinedAdmin);
    setIsAuthenticatedUser(true);
    setStatus(AUTH_STATUS.AUTHENTICATED);

    const authState = {
      isAuthenticated: true,
      isAdmin: determinedAdmin,
      timestamp: Date.now()
    };
    localStorage.setItem('admin_auth_state', JSON.stringify(authState));
  };

  // Check existing token on mount
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      if (sessionCheckedRef.current || authInProgressRef.current) {
        console.log('Session check already in progress, skipping...');
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth_token found, user is not logged in');
        setStatus(AUTH_STATUS.IDLE);
        return;
      }

      sessionCheckedRef.current = true;
      authInProgressRef.current = true;
      setStatus(AUTH_STATUS.PENDING_ACTION);

      console.log('Starting initial session check...');

      try {
        const data = await api.get('/auth/verify');

        if (!mounted) return;

        if (data && data.user) {
          console.log('Found valid session on mount');
          applyUserSession(data.user);
        } else {
          console.log('Token verify returned no user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin_auth_state');
          if (mounted) setStatus(AUTH_STATUS.IDLE);
        }
      } catch (error) {
        console.error('Error during initial session check:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_auth_state');
        if (mounted) setStatus(AUTH_STATUS.IDLE);
      } finally {
        if (mounted) authInProgressRef.current = false;
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      authInProgressRef.current = false;
    };
  }, []);

  const signInWithEmail = async (email, password, recaptchaToken = null) => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);

      console.log('reCAPTCHA token received for admin login:', recaptchaToken ? 'Yes' : 'No');

      const data = await api.post('/auth/login', { email, password });

      if (!data || !data.token || !data.user) {
        setStatus(AUTH_STATUS.IDLE);
        return { success: false, error: { message: 'No session data received' } };
      }

      localStorage.setItem('auth_token', data.token);
      applyUserSession(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      setStatus(AUTH_STATUS.IDLE);
      return { success: false, error };
    }
  };

  const signUpWithEmail = async (email, password, fullName) => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);

      const [firstName, ...rest] = (fullName || '').split(' ');
      const lastName = rest.join(' ');

      const data = await api.post('/auth/register', { email, password, firstName, lastName });

      if (data && data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        applyUserSession(data.user);
        return { success: true, user: data.user, needsConfirmation: false };
      }

      setStatus(AUTH_STATUS.IDLE);
      return { success: true, user: data?.user || null, needsConfirmation: true };
    } catch (error) {
      setStatus(AUTH_STATUS.IDLE);
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);

      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_auth_state');

      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsAuthenticatedUser(false);
      setStatus(AUTH_STATUS.IDLE);

      sessionCheckedRef.current = false;
      authInProgressRef.current = false;

      console.log('Successfully signed out');
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      setStatus(AUTH_STATUS.IDLE);
    }
  };

  const triggerAuthentication = async () => {
    if (status === AUTH_STATUS.AUTHENTICATED || authInProgressRef.current) {
      console.log('Skipping auth trigger - already authenticated or in progress');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No token found during auth trigger');
      setStatus(AUTH_STATUS.IDLE);
      return;
    }

    console.log('Manual authentication trigger...');
    authInProgressRef.current = true;
    setStatus(AUTH_STATUS.PENDING_ACTION);

    try {
      const data = await api.get('/auth/verify');

      if (data && data.user) {
        console.log('Found valid session during trigger');
        applyUserSession(data.user);
      } else {
        console.log('No session found during trigger');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_auth_state');
        setStatus(AUTH_STATUS.IDLE);
      }
    } catch (error) {
      console.error('Unexpected error during auth trigger:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_auth_state');
      setStatus(AUTH_STATUS.IDLE);
    } finally {
      authInProgressRef.current = false;
    }
  };

  const sendPasswordResetEmail = async (email) => {
    // No backend equivalent - direct users to contact support
    return {
      success: true,
      message: "Please contact support to reset your password"
    };
  };

  const updatePassword = async (newPassword, currentPassword = null) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const resetAuthState = () => {
    console.log('Resetting auth state...');
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsAuthenticatedUser(false);
    setStatus(AUTH_STATUS.IDLE);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_auth_state');
    sessionCheckedRef.current = false;
    authInProgressRef.current = false;
  };

  const contextValue = {
    user,
    profile,
    isAdmin,
    isAuthenticatedUser,
    status,
    signInWithEmail,
    signUpWithEmail,
    handleSignOut,
    sendPasswordResetEmail,
    updatePassword,
    resetAuthState,
    triggerAuthentication,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  return (
    <AuthProviderInternal>
      {children}
    </AuthProviderInternal>
  );
};
