import { supabase } from '@/lib/supabase';

export const fetchUserProfile = async (userId) => {
  console.log(`Fetching profile for userId: ${userId}`);
  if (!userId) {
    console.error("fetchUserProfile: userId is undefined or null");
    return null;
  }
  
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
    });
    
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      // It's okay if no row is found (PGRST116), means profile doesn't exist yet.
      if (error.code === 'PGRST116') { 
        console.log(`fetchUserProfile: No profile found for user ${userId}. This might be normal for a new user.`);
        return null;
      }
      
      // Handle permission errors more gracefully
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn(`fetchUserProfile: Permission error for user ${userId}:`, error);
        return null; // Allow profile creation to continue
      }
      
      console.error(`fetchUserProfile: Error fetching profile for user ${userId}:`, error);
      // Don't throw error, return null to allow profile creation
      return null;
    }
    
    if (data) {
      console.log(`fetchUserProfile: Successfully fetched profile for user ${userId}:`, data);
      return data;
    }
    
    console.log(`fetchUserProfile: No profile data returned for user ${userId}`);
    return null;
  } catch (err) {
    if (err.message?.includes('timeout')) {
      console.warn(`fetchUserProfile: Timeout fetching profile for user ${userId}`);
    } else {
      console.error(`fetchUserProfile: Unexpected error for user ${userId}:`, err);
    }
    // Return null instead of throwing to allow profile creation
    return null;
  }
};

export const createInitialUserProfile = async (userId, email, fullName, role = 'customer') => {
  console.log(`Creating initial profile for userId: ${userId}, email: ${email}, role: ${role}`);
  if (!userId || !email) {
    console.error("createInitialUserProfile: userId or email is undefined or null");
    throw new Error("User ID and Email are required to create a profile.");
  }
  
  try {
    // First, check if a profile exists with this email but different ID (mismatch scenario)
    console.log(`Checking for existing profile with email: ${email}`);
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingProfile && existingProfile.id !== userId) {
      console.log(`Found existing profile with email ${email} but different ID. Updating ID from ${existingProfile.id} to ${userId}`);
      // Update the existing profile to use the correct user ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ id: userId })
        .eq('email', email)
        .select()
        .single();
        
      if (updateError) {
        console.error(`Error updating existing profile ID:`, updateError);
        throw updateError;
      }
      
      console.log(`Successfully updated profile ID for ${email}`);
      return updatedProfile;
    }
    
    if (existingProfile && existingProfile.id === userId) {
      console.log(`Profile already exists with correct ID for ${email}`);
      return existingProfile;
    }
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile creation timeout')), 10000);
    });
    
    const createPromise = supabase
      .from('profiles')
      .insert([
        { 
          id: userId, 
          email: email,
          full_name: fullName, 
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        }
      ])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]);

    if (error) {
      console.error(`createInitialUserProfile: Error creating profile for user ${userId}:`, error);
      
      // If it's a conflict error (409), try to fetch the existing profile
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('conflict')) {
        console.log(`Conflict detected, attempting to fetch existing profile for ${email}`);
        const { data: conflictProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
          
        if (conflictProfile) {
          console.log(`Using existing profile for ${email}`);
          return conflictProfile;
        }
      }
      
      throw error;
    }
    console.log(`createInitialUserProfile: Successfully created profile for user ${userId}:`, data);
    return data;
  } catch (err) {
    console.error(`createInitialUserProfile: Unexpected error for user ${userId}:`, err);
    throw err; // Re-throw
  }
};

export const updateUserProfileLastSignIn = async (userId) => {
  console.log(`Updating last sign-in (updated_at) for userId: ${userId}`);
  if (!userId) {
    console.error("updateUserProfileLastSignIn: userId is undefined or null");
    return;
  }
  try {
    // The trigger 'on_profile_update' will automatically set updated_at to NOW()
    // So, we just need to perform any update operation, even if it's on the same data.
    // A common pattern is to update a field like 'last_sign_in_at' if it exists,
    // or just re-set an existing field to trigger the update.
    // Since 'updated_at' is now auto-managed by the trigger, we can update a dummy field or
    // simply update the existing email to itself to fire the trigger.
    // For simplicity, let's just set 'updated_at' explicitly, although the trigger would override it.
    // A safer approach is to update a field that isn't `updated_at` itself, if we want the trigger to handle it exclusively.
    // However, Supabase client usually requires specifying some field to update.
    // Let's update `email` with its current value to ensure the trigger fires.
    // This assumes the user's email is available or can be fetched.
    // A more direct approach if the trigger is reliable is to just update a field.
    
    // Fetch current email to re-set it, or just update any field.
    // Simpler: just update updated_at, the trigger will ensure it's NOW().
    const { data, error } = await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() }) // This will be overridden by trigger to NOW()
      .eq('id', userId)
      .select('id, updated_at')
      .single();

    if (error) {
      console.error(`updateUserProfileLastSignIn: Error updating profile for user ${userId}:`, error);
      // Don't throw critical error for this, as it's a non-essential update for login flow.
      // Log and continue.
    } else {
      console.log(`updateUserProfileLastSignIn: Successfully updated 'updated_at' for user ${userId}:`, data);
    }
  } catch (err) {
    console.error(`updateUserProfileLastSignIn: Unexpected error for user ${userId}:`, err);
  }
};


export const fetchUsersWithEdgeFunction = async () => {
  const { data, error } = await supabase.functions.invoke('list-users-admin');
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  return data?.users || [];
};

export const updateUserRoleWithEdgeFunction = async (userId, role) => {
  const { data, error } = await supabase.functions.invoke('update-user-role-admin', {
    body: { userId, role },
  });
  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
  return data;
};

export const deleteUserWithEdgeFunction = async (userId) => {
   const { data, error } = await supabase.functions.invoke('delete-user-admin', {
    body: { userId },
  });
  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
  return data;
};

// Placeholder or example for inviting a user, might need an Edge Function
export const inviteUserByEmailWithEdgeFunction = async (email, role = 'customer') => {
  // This typically involves supabase.auth.admin.inviteUserByEmail which is admin-only
  // For client-side, you'd call an Edge Function that has admin privileges.
  const { data, error } = await supabase.functions.invoke('invite-user-admin', {
    body: { email, role }, // Role might be passed to assign during profile creation
  });

  if (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
  return data; // Should return success/failure or invited user details
};
