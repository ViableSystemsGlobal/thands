
import { useState } from 'react';

export const AUTH_STATUS = {
  IDLE: 'IDLE',
  PENDING_ACTION: 'PENDING_ACTION',
  AUTHENTICATED: 'AUTHENTICATED',
  ERROR: 'ERROR',
};

export const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [status, setStatus] = useState(AUTH_STATUS.IDLE);

  return {
    user, setUser,
    profile, setProfile,
    isAdmin, setIsAdmin,
    isAuthenticatedUser, setIsAuthenticatedUser,
    status, setStatus,
    AUTH_STATUS_ENUM: AUTH_STATUS,
  };
};
