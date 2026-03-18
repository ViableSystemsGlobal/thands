import { useCallback } from 'react';
import { api } from '@/lib/services/api';

export const useAuthActions = (
  setStatus,
  processSessionData,
  signOutLogic,
  toast,
  AUTH_STATUS_ENUM
) => {
  const signInWithEmail = useCallback(async (email, password) => {
    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    try {
      const data = await api.post('/auth/login', { email, password });

      if (!data || !data.token || !data.user) {
        setStatus(AUTH_STATUS_ENUM.IDLE);
        return { success: false, error: { message: 'Unknown sign-in issue.' } };
      }

      localStorage.setItem('auth_token', data.token);

      const processingResult = await processSessionData({ user: data.user, token: data.token });
      if (processingResult.processedUser) {
        setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
        toast({ title: "Signed In", description: "Welcome back!" });
        return { success: true, user: data.user, session: { token: data.token }, profile: processingResult.profile };
      } else {
        setStatus(AUTH_STATUS_ENUM.ERROR);
        await signOutLogic({ showToast: false, navigateTo: null });
        return { success: false, error: { message: processingResult.error || "Sign-in successful, but profile processing failed." } };
      }
    } catch (error) {
      toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR);
      return { success: false, error };
    }
  }, [processSessionData, signOutLogic, toast, setStatus, AUTH_STATUS_ENUM]);

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    try {
      const [firstName, ...rest] = (fullName || '').split(' ');
      const lastName = rest.join(' ');

      const data = await api.post('/auth/register', { email, password, firstName, lastName });

      if (data && data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        const processingResult = await processSessionData({ user: data.user, token: data.token });
        if (processingResult.processedUser) {
          setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
          toast({ title: "Sign Up Successful", description: "Welcome! Your account is active." });
          return { success: true, user: data.user, session: { token: data.token }, profile: processingResult.profile };
        } else {
          setStatus(AUTH_STATUS_ENUM.ERROR);
          await signOutLogic({ showToast: false, navigateTo: null });
          return { success: false, error: { message: processingResult.error || "Sign-up successful, but profile setup failed." } };
        }
      } else {
        setStatus(AUTH_STATUS_ENUM.IDLE);
        toast({ title: "Sign Up Almost Complete!", description: "Please check your email to confirm your account, then log in." });
        return { success: true, user: data?.user || null, session: null };
      }
    } catch (error) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR);
      return { success: false, error };
    }
  }, [processSessionData, signOutLogic, toast, setStatus, AUTH_STATUS_ENUM]);

  const sendPasswordResetEmail = useCallback(async (email) => {
    // No backend equivalent — direct users to contact support
    setStatus(AUTH_STATUS_ENUM.IDLE);
    toast({ title: "Password Reset", description: "Please contact support to reset your password." });
    return { success: true };
  }, [toast, setStatus, AUTH_STATUS_ENUM]);

  const updatePassword = useCallback(async (newPassword, currentPassword = null) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ title: "Password Update Error", description: "You must be logged in to update your password.", variant: "destructive" });
      return { success: false, error: { message: "User not authenticated." } };
    }

    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
      toast({ title: "Password Updated Successfully", description: "You can now sign in with your new password." });
      return { success: true };
    } catch (updateError) {
      toast({ title: "Password Update Error", description: updateError.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR);
      return { success: false, error: updateError };
    }
  }, [toast, setStatus, AUTH_STATUS_ENUM]);

  return {
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    updatePassword,
  };
};
