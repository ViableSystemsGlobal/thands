import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { 
  fetchUserProfile, 
  updateUserProfileLastSignIn, 
  createInitialUserProfile 
} from '@/lib/db/users';

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
  // Basic state with useState only
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  // Always start with IDLE to prevent authentication loops
  const [status, setStatus] = useState(AUTH_STATUS.IDLE);
  
  const { toast } = useToast();
  
  // Simple refs for preventing multiple auth attempts
  const authInProgressRef = useRef(false);
  const sessionCheckedRef = useRef(false);
  const profileCreationInProgressRef = useRef(new Set()); // Track profile creation by user ID

  // Helper function to safely create or fetch profile
  const getOrCreateProfile = async (userId, email, fullName = null, role = 'customer') => {
    // Prevent multiple concurrent profile creations for the same user
    if (profileCreationInProgressRef.current.has(userId)) {
      console.log(`⏳ Profile creation already in progress for user ${userId}, waiting...`);
      // Wait for existing creation to complete
      let attempts = 0;
      while (profileCreationInProgressRef.current.has(userId) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      // Try to fetch the profile again
      const existingProfile = await fetchUserProfile(userId);
      if (existingProfile) {
        return existingProfile;
      }
    }

    // First try to fetch existing profile
    let userProfile = await fetchUserProfile(userId);
    if (userProfile) {
      console.log(`✅ Found existing profile for user ${userId}`);
      return userProfile;
    }

    // Mark profile creation in progress
    profileCreationInProgressRef.current.add(userId);
    
    try {
      console.log(`🔄 Creating new profile for user ${userId}`);
      const isAdminUser = email.includes('@tailoredhands.') || email === 'admin@tailoredhands.com';
      const userRole = isAdminUser ? 'admin' : role;
      
      userProfile = await createInitialUserProfile(
        userId, 
        email, 
        fullName || email.split('@')[0],
        userRole
      );
      
      console.log(`✅ Successfully created profile for user ${userId}`);
      return userProfile;
    } catch (error) {
      console.error(`❌ Error creating profile for user ${userId}:`, error);
      // Try one more time to fetch in case it was created by another process
      const retryProfile = await fetchUserProfile(userId);
      if (retryProfile) {
        console.log(`✅ Found profile on retry for user ${userId}`);
        return retryProfile;
      }
      throw error;
    } finally {
      // Always remove from progress tracking
      profileCreationInProgressRef.current.delete(userId);
    }
  };

  // Simple check for existing session on mount - ONLY run once
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      if (sessionCheckedRef.current || authInProgressRef.current) {
        console.log('🔐 Session check already in progress, skipping...');
        return;
      }
      
      sessionCheckedRef.current = true;
      authInProgressRef.current = true;
      setStatus(AUTH_STATUS.PENDING_ACTION);
      
      console.log('🔐 Starting initial session check...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return; // Component was unmounted
        
        if (error) {
          console.error('❌ Initial session check error:', error);
          localStorage.removeItem('admin_auth_state');
          setStatus(AUTH_STATUS.IDLE);
          return;
        }

        if (session) {
          console.log('✅ Found existing session on mount');
          // Process the session
          setUser(session.user);
          
          try {
            const userProfile = await getOrCreateProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.full_name
            );
            
            if (userProfile && mounted) {
              setProfile(userProfile);
              setIsAdmin(userProfile.role === 'admin');
              setIsAuthenticatedUser(true);
              setStatus(AUTH_STATUS.AUTHENTICATED);
              
              // Update cached auth state
              const authState = {
                isAuthenticated: true,
                isAdmin: userProfile.role === 'admin',
                timestamp: Date.now()
              };
              localStorage.setItem('admin_auth_state', JSON.stringify(authState));
              
              try {
                await updateUserProfileLastSignIn(session.user.id);
              } catch (error) {
                console.warn('Failed to update last sign-in time:', error);
              }
            } else if (mounted) {
              localStorage.removeItem('admin_auth_state');
              setStatus(AUTH_STATUS.IDLE);
            }
          } catch (error) {
            console.error('Error processing initial session:', error);
            if (mounted) {
              localStorage.removeItem('admin_auth_state');
              setStatus(AUTH_STATUS.IDLE);
            }
          }
        } else {
          console.log('❌ No existing session found');
          localStorage.removeItem('admin_auth_state');
          if (mounted) setStatus(AUTH_STATUS.IDLE);
        }
      } catch (error) {
        console.error('❌ Error during initial session check:', error);
        localStorage.removeItem('admin_auth_state');
        if (mounted) setStatus(AUTH_STATUS.IDLE);
      } finally {
        if (mounted) authInProgressRef.current = false;
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      // Clear any ongoing operations
      authInProgressRef.current = false;
      profileCreationInProgressRef.current.clear();
    };
  }, []);

  // Simple authentication functions
  const signInWithEmail = async (email, password, recaptchaToken = null) => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);
      
      // reCAPTCHA token will be verified by the backend
      // For now, we just ensure the token is provided
      console.log('reCAPTCHA token received for admin login:', recaptchaToken ? 'Yes' : 'No');
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setStatus(AUTH_STATUS.IDLE);
        return { success: false, error };
      }
      
      // Inline session processing
      if (data.session) {
        setUser(data.session.user);
        
        try {
          const userProfile = await getOrCreateProfile(
            data.session.user.id,
            data.session.user.email,
            data.session.user.user_metadata?.full_name
          );
          
          if (userProfile) {
            setProfile(userProfile);
            const determinedAdmin = userProfile.role === 'admin';
            setIsAdmin(determinedAdmin);
            setIsAuthenticatedUser(true);
            setStatus(AUTH_STATUS.AUTHENTICATED);
            
            // Update cached auth state
            const authState = {
              isAuthenticated: true,
              isAdmin: determinedAdmin,
              timestamp: Date.now()
            };
            localStorage.setItem('admin_auth_state', JSON.stringify(authState));
            
            try {
              await updateUserProfileLastSignIn(data.session.user.id);
            } catch (error) {
              console.warn('Failed to update last sign-in time:', error);
            }
            
            return { success: true, user: data.user };
          } else {
            setStatus(AUTH_STATUS.IDLE);
            return { success: false, error: { message: "Failed to load user profile" } };
          }
        } catch (error) {
          console.error('Error processing session:', error);
          setStatus(AUTH_STATUS.IDLE);
          return { success: false, error: { message: "Failed to process user data" } };
        }
      } else {
        setStatus(AUTH_STATUS.IDLE);
        return { success: false, error: { message: "No session data received" } };
      }
    } catch (error) {
      setStatus(AUTH_STATUS.IDLE);
      return { success: false, error };
    }
  };

  const signUpWithEmail = async (email, password, fullName) => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) {
        setStatus(AUTH_STATUS.IDLE);
        return { success: false, error };
      }
      
      setStatus(AUTH_STATUS.IDLE);
      return { success: true, user: data.user, needsConfirmation: !data.session };
    } catch (error) {
      setStatus(AUTH_STATUS.IDLE);
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      setStatus(AUTH_STATUS.PENDING_ACTION);
      const { error } = await supabase.auth.signOut();
      
      // Clear all state
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsAuthenticatedUser(false);
      setStatus(AUTH_STATUS.IDLE);
      
      // Clear all cached state
      localStorage.removeItem('admin_auth_state');
      sessionCheckedRef.current = false;
      authInProgressRef.current = false;
      profileCreationInProgressRef.current.clear();
      
      if (error) {
        console.error("Error signing out:", error);
        toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
      } else {
        console.log("✅ Successfully signed out");
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      setStatus(AUTH_STATUS.IDLE);
    }
  };

  const triggerAuthentication = async () => {
    // Don't trigger if already authenticated or in progress
    if (status === AUTH_STATUS.AUTHENTICATED || authInProgressRef.current) {
      console.log('🔐 Skipping auth trigger - already authenticated or in progress');
      return;
    }

    console.log('🔐 Manual authentication trigger...');
    authInProgressRef.current = true;
    setStatus(AUTH_STATUS.PENDING_ACTION);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ AuthProvider: Error getting session:', error);
        localStorage.removeItem('admin_auth_state');
        setStatus(AUTH_STATUS.IDLE);
        return;
      }

      if (session) {
        console.log('✅ Found valid session during trigger');
        // Process the session
        setUser(session.user);
        
        try {
          const userProfile = await getOrCreateProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.full_name
          );
          
          if (userProfile) {
            setProfile(userProfile);
            const determinedAdmin = userProfile.role === 'admin';
            setIsAdmin(determinedAdmin);
            setIsAuthenticatedUser(true);
            setStatus(AUTH_STATUS.AUTHENTICATED);
            
            // Update cached auth state
            const authState = {
              isAuthenticated: true,
              isAdmin: determinedAdmin,
              timestamp: Date.now()
            };
            localStorage.setItem('admin_auth_state', JSON.stringify(authState));
            
            try {
              await updateUserProfileLastSignIn(session.user.id);
            } catch (error) {
              console.warn('Failed to update last sign-in time:', error);
            }
          } else {
            console.error('❌ Failed to create/fetch user profile during trigger');
            localStorage.removeItem('admin_auth_state');
            setStatus(AUTH_STATUS.IDLE);
          }
        } catch (error) {
          console.error('❌ Error processing session during trigger:', error);
          localStorage.removeItem('admin_auth_state');
          setStatus(AUTH_STATUS.IDLE);
        }
      } else {
        console.log('❌ No session found during trigger');
        localStorage.removeItem('admin_auth_state');
        setStatus(AUTH_STATUS.IDLE);
      }
    } catch (error) {
      console.error('❌ Unexpected error during auth trigger:', error);
      localStorage.removeItem('admin_auth_state');
      setStatus(AUTH_STATUS.IDLE);
    } finally {
      authInProgressRef.current = false;
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const resetAuthState = () => {
    console.log('🔄 Resetting auth state...');
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsAuthenticatedUser(false);
    setStatus(AUTH_STATUS.IDLE);
    localStorage.removeItem('admin_auth_state');
    sessionCheckedRef.current = false;
    authInProgressRef.current = false;
    profileCreationInProgressRef.current.clear();
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
