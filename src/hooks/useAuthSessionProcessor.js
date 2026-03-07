import { useCallback } from 'react';
// Removed AUTH_STATUS import from here, it will be used from AuthContext directly or passed if needed.
// Assuming AUTH_STATUS is available in the scope where processSessionData is called (e.g. AuthContext.jsx)

export const useAuthSessionProcessor = (options) => {
  const { 
    setStatus, setUser, setProfile, setIsAdmin, 
    setIsAuthenticatedUser, 
    // setSession is removed as we are not managing global session state in AuthContext anymore
    resetInactivityTimer, clearInactivityTimer, toast,
    fetchUserProfile, createInitialUserProfile, updateUserProfileLastSignIn,
    // Explicitly pass AUTH_STATUS if needed, or rely on setStatus to use the one from AuthContext
    AUTH_STATUS_ENUM // Pass the enum for clarity
  } = options;

  return useCallback(async (currentSession) => { // currentSession is passed from signIn/signUp
    console.log("AuthSessionProcessor: processSessionData - START. Session User:", currentSession?.user?.email);
    if (currentSession?.user) {
      setUser(currentSession.user);
      // No global setSession(currentSession) call here
      
      let userProfile = null;
      try {
        console.log("AuthSessionProcessor: Fetching user profile...");
        userProfile = await fetchUserProfile(currentSession.user.id);
        console.log("AuthSessionProcessor: Profile fetch completed:", userProfile ? 'Found' : 'Not found');
      } catch (fetchError) {
        console.error("AuthSessionProcessor: Error fetching user profile:", fetchError);
        // Don't show toast for timeout errors, just log them
        if (!fetchError.message?.includes('timeout')) {
          toast({ title: "Profile Error", description: "Could not load your user profile. Creating new profile...", variant: "destructive" });
        }
        userProfile = null; // Ensure it's null so we try to create one
      }
      
      if (!userProfile && currentSession.user.email) {
          console.log("AuthSessionProcessor: No profile found or fetch failed, attempting to create one for:", currentSession.user.email);
          
          // All new profiles default to customer. Admin roles must be assigned manually in the database.
          const role = 'customer';
          
          try {
            const newProfileData = await createInitialUserProfile(
              currentSession.user.id, 
              currentSession.user.email, 
              currentSession.user.user_metadata?.full_name || currentSession.user.email.split('@')[0],
              role
            );
            if (newProfileData) {
              userProfile = newProfileData;
              console.log("AuthSessionProcessor: Successfully created profile with role:", role);
            } else {
              console.error("AuthSessionProcessor: Failed to create initial user profile, createInitialUserProfile returned null/undefined.");
              toast({ title: "Profile Error", description: "Could not create your user profile. Please contact support.", variant: "destructive" });
              if (setStatus && AUTH_STATUS_ENUM) setStatus(AUTH_STATUS_ENUM.IDLE);
              return { processedUser: false, processedAdmin: false };
            }
          } catch (creationError) {
            console.error("AuthSessionProcessor: Error during createInitialUserProfile:", creationError);
            toast({ title: "Profile Creation Error", description: creationError.message || "An unexpected error occurred while creating your profile.", variant: "destructive" });
            if (setStatus && AUTH_STATUS_ENUM) setStatus(AUTH_STATUS_ENUM.IDLE);
            return { processedUser: false, processedAdmin: false };
          }
      }
      
      if (userProfile) {
        setProfile(userProfile);
        const determinedAdmin = userProfile.role === 'admin';
        setIsAdmin(determinedAdmin);
        setIsAuthenticatedUser(true);
        console.log(`AuthSessionProcessor: processSessionData - User: ${currentSession.user.id}, Profile: ${userProfile.id}, Role: ${userProfile.role}, IsAdmin: ${determinedAdmin}`);
        try {
          await updateUserProfileLastSignIn(currentSession.user.id);
        } catch (signInUpdateError) {
          console.warn("AuthSessionProcessor: Failed to update last sign-in time:", signInUpdateError);
        }
        resetInactivityTimer();
        // Status will be set to AUTHENTICATED by the calling function (signIn/signUp) after this returns successfully
        return { processedUser: true, processedAdmin: determinedAdmin, user: currentSession.user, profile: userProfile };
      } else {
        console.warn("AuthSessionProcessor: processSessionData - User exists but profile is still null after attempt to fetch/create. User:", currentSession.user.id);
        setUser(null); setProfile(null); setIsAdmin(false); setIsAuthenticatedUser(false);
        toast({ title: "Profile Error", description: "Could not load or create your user profile. Please try signing in again or contact support.", variant: "destructive" });
        if (setStatus && AUTH_STATUS_ENUM) setStatus(AUTH_STATUS_ENUM.IDLE);
        return { processedUser: false, processedAdmin: false };
      }
    } else {
      console.log("AuthSessionProcessor: processSessionData - No active session or user provided.");
      setUser(null); setProfile(null); setIsAdmin(false); setIsAuthenticatedUser(false);
      clearInactivityTimer();
      // Status will be set to IDLE or ERROR by the calling function
      return { processedUser: false, processedAdmin: false };
    }
  }, [
      setStatus, setUser, setProfile, setIsAdmin, setIsAuthenticatedUser, 
      resetInactivityTimer, clearInactivityTimer, toast,
      fetchUserProfile, createInitialUserProfile, updateUserProfileLastSignIn,
      AUTH_STATUS_ENUM // Add to dependencies
    ]);
};
