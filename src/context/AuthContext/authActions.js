
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useAuthActions = (
  setStatus,
  processSessionData,
  signOutLogic,
  toast,
  AUTH_STATUS_ENUM
) => {
  const signInWithEmail = useCallback(async (email, password) => {
    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR); return { success: false, error };
    }
    if (data.session) {
      const processingResult = await processSessionData(data.session);
      if (processingResult.processedUser) {
        setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
        toast({ title: "Signed In", description: "Welcome back!" });
        return { success: true, user: data.user, session: data.session, profile: processingResult.profile };
      } else {
        setStatus(AUTH_STATUS_ENUM.ERROR);
        await signOutLogic({ showToast: false, navigateTo: null });
        return { success: false, error: { message: processingResult.error || "Sign-in successful, but profile processing failed." } };
      }
    }
    setStatus(AUTH_STATUS_ENUM.IDLE);
    return { success: false, error: { message: "Unknown sign-in issue." } };
  }, [processSessionData, signOutLogic, toast, setStatus, AUTH_STATUS_ENUM]);

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });

    if (error) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR); return { success: false, error };
    }
    
    if (data.user) {
      if (data.session) {
        const processingResult = await processSessionData(data.session);
        if (processingResult.processedUser) {
          setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
          toast({ title: "Sign Up Successful", description: "Welcome! Your account is active." });
          return { success: true, user: data.user, session: data.session, profile: processingResult.profile };
        } else {
          setStatus(AUTH_STATUS_ENUM.ERROR);
          await signOutLogic({ showToast: false, navigateTo: null });
          return { success: false, error: { message: processingResult.error || "Sign-up successful, but profile setup failed." } };
        }
      } else {
        setStatus(AUTH_STATUS_ENUM.IDLE);
        toast({ title: "Sign Up Almost Complete!", description: "Please check your email to confirm your account, then log in." });
        return { success: true, user: data.user, session: null };
      }
    }
    
    setStatus(AUTH_STATUS_ENUM.ERROR);
    return { success: false, error: { message: "Unknown sign-up issue." } };
  }, [processSessionData, signOutLogic, toast, setStatus, AUTH_STATUS_ENUM]);

  const sendPasswordResetEmail = useCallback(async (email) => {
    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast({ title: "Password Reset Error", description: error.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR); return { success: false, error };
    }
    setStatus(AUTH_STATUS_ENUM.IDLE);
    toast({ title: "Password Reset Email Sent", description: "Check your email for instructions." });
    return { success: true };
  }, [toast, setStatus, AUTH_STATUS_ENUM]);

  const updatePassword = useCallback(async (newPassword) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast({ title: "Password Update Error", description: "You must be logged in to update your password.", variant: "destructive" });
        return { success: false, error: { message: "User not authenticated." } };
    }

    setStatus(AUTH_STATUS_ENUM.PENDING_ACTION);
    const { data, error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      toast({ title: "Password Update Error", description: updateError.message, variant: "destructive" });
      setStatus(AUTH_STATUS_ENUM.ERROR); return { success: false, error: updateError };
    }
    setStatus(AUTH_STATUS_ENUM.AUTHENTICATED);
    toast({ title: "Password Updated Successfully", description: "You can now sign in with your new password." });
    return { success: true, user: data.user };
  }, [toast, setStatus, AUTH_STATUS_ENUM]);

  return {
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    updatePassword,
  };
};
