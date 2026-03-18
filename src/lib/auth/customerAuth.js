import { api } from '@/lib/services/api';

/**
 * Enhanced Customer Authentication Service
 * Handles guest customers, registered users, and account linking
 */

/**
 * Sign up a new user account
 */
export const signUpCustomer = async ({ email, password, firstName, lastName, phone, sessionId = null, recaptchaToken = null }) => {
  try {
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Email, password, first name, and last name are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    console.log('reCAPTCHA token received for signup:', recaptchaToken ? 'Yes' : 'No');

    if (email === "admin@tailoredhands.com" || email.includes('@tailoredhands.')) {
      throw new Error("This email is reserved. Please use a different email for customer signup.");
    }

    const data = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
    });

    if (!data || !data.user) {
      throw new Error("Account creation failed. No user data returned.");
    }

    const isAutoLoggedIn = !!data.token;

    if (isAutoLoggedIn) {
      localStorage.setItem('auth_token', data.token);
    }

    return {
      success: true,
      user: data.user,
      session: isAutoLoggedIn ? { token: data.token } : null,
      isAutoLoggedIn,
      needsConfirmation: !isAutoLoggedIn,
      customerHistory: null,
      transferResults: null,
      message: isAutoLoggedIn
        ? "Account created and you're now logged in!"
        : "Account created! Please check your email to confirm your account."
    };

  } catch (error) {
    console.error('Customer signup error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during signup.'
    };
  }
};

/**
 * Sign in an existing user
 */
export const signInCustomer = async ({ email, password, recaptchaToken = null }) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    console.log('reCAPTCHA token received for signin:', recaptchaToken ? 'Yes' : 'No');

    const data = await api.post('/auth/login', { email, password });

    if (!data || !data.user || !data.token) {
      throw new Error('Sign in failed. No user data received.');
    }

    localStorage.setItem('auth_token', data.token);

    return {
      success: true,
      user: data.user,
      session: { token: data.token },
      customer: data.user,
      profile: data.user,
      message: `Welcome back${data.user.firstName ? `, ${data.user.firstName}` : ''}!`
    };

  } catch (error) {
    console.error('Customer signin error:', error);

    let errorMessage = error.message || 'An unexpected error occurred during sign in.';
    if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('credentials')) {
      errorMessage = 'Invalid email or password. Please try again.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign out the current user
 */
export const signOutCustomer = async () => {
  try {
    localStorage.removeItem('auth_token');

    return {
      success: true,
      message: 'You have been successfully signed out.'
    };

  } catch (error) {
    console.error('Customer signout error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during sign out.'
    };
  }
};

/**
 * Get customer history for an email
 * No direct backend equivalent - returns empty history
 */
export const getCustomerHistoryByEmail = async (email) => {
  return {
    success: true,
    history: {
      orders_count: 0,
      total_spent: 0,
      last_order_date: null,
      cart_items_count: 0,
      wishlist_items_count: 0
    }
  };
};

/**
 * Check if an email already has an account
 * Graceful no-op - returns false to allow sign-up attempt
 */
export const checkEmailExists = async (email) => {
  try {
    // Attempt a login with a dummy password to detect existing accounts
    // If we get an auth error the account may or may not exist; default to not blocking
    return { exists: false, isRegistered: false };
  } catch (error) {
    console.error('Error checking email existence:', error);
    return { exists: false, isRegistered: false };
  }
};

/**
 * Send password reset email
 * No backend equivalent - direct users to contact support
 */
export const sendPasswordReset = async (email) => {
  return {
    success: true,
    message: 'Please contact support to reset your password.'
  };
};

/**
 * Update user password (for logged-in users)
 */
export const updateCustomerPassword = async (newPassword, currentPassword = null) => {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    await api.put('/auth/change-password', { currentPassword, newPassword });

    return {
      success: true,
      message: 'Password updated successfully.'
    };

  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred updating password.'
    };
  }
};

/**
 * Resend email confirmation
 * No backend equivalent - graceful no-op
 */
export const resendEmailConfirmation = async (email) => {
  return {
    success: true,
    message: 'Please contact support if you need help confirming your account.'
  };
};
