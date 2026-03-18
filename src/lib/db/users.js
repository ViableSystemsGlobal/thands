import { api } from '@/lib/services/api';

export const fetchUserProfile = async (userId) => {
  console.log(`Fetching profile for userId: ${userId}`);
  if (!userId) {
    console.error("fetchUserProfile: userId is undefined or null");
    return null;
  }

  try {
    const data = await api.get('/auth/profile');
    if (data && data.user) {
      console.log(`fetchUserProfile: Successfully fetched profile for user ${userId}`);
      return data.user;
    }
    return null;
  } catch (err) {
    console.error(`fetchUserProfile: Error fetching profile for user ${userId}:`, err);
    return null;
  }
};

export const createInitialUserProfile = async (userId, email, fullName, role = 'customer') => {
  // Profile is created automatically on the backend during registration.
  // Return a minimal profile object so callers don't break.
  console.log(`createInitialUserProfile called for ${userId} - profile managed by backend`);
  return {
    id: userId,
    email,
    full_name: fullName,
    role,
  };
};

export const updateUserProfileLastSignIn = async (userId) => {
  // Sign-in timestamp is managed by the backend; no-op on the frontend.
  console.log(`updateUserProfileLastSignIn: no-op for user ${userId}`);
};

export const fetchUsersWithEdgeFunction = async () => {
  // Admin user management not yet implemented in backend
  console.warn('fetchUsersWithEdgeFunction: admin user listing not yet implemented in backend');
  return [];
};

export const updateUserRoleWithEdgeFunction = async (userId, role) => {
  // Admin user role update not yet implemented in backend
  console.warn('updateUserRoleWithEdgeFunction: not yet implemented in backend');
  return null;
};

export const deleteUserWithEdgeFunction = async (userId) => {
  // Admin user deletion not yet implemented in backend
  console.warn('deleteUserWithEdgeFunction: not yet implemented in backend');
  return null;
};

export const inviteUserByEmailWithEdgeFunction = async (email, role = 'customer') => {
  // Admin user invite not yet implemented in backend
  console.warn('inviteUserByEmailWithEdgeFunction: not yet implemented in backend');
  return null;
};
