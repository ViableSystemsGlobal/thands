import { supabase } from '@/lib/supabase';

/**
 * Enhanced Customer Authentication Service
 * Handles guest customers, registered users, and account linking
 */

/**
 * Sign up a new user account
 * Automatically links any existing guest customer data
 * Automatically logs in the user after successful account creation
 */
export const signUpCustomer = async ({ email, password, firstName, lastName, phone, sessionId = null, recaptchaToken = null }) => {
  try {
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Email, password, first name, and last name are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // reCAPTCHA token will be verified by the backend
    // For now, we just ensure the token is provided
    console.log('reCAPTCHA token received for signup:', recaptchaToken ? 'Yes' : 'No');

    // Check for admin email
    if (email === "admin@tailoredhands.com" || email.includes('@tailoredhands.')) {
      throw new Error("This email is reserved. Please use a different email for customer signup.");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.getUser();
    if (existingUser?.user && existingUser.user.email === email) {
      throw new Error("You are already logged in with this email.");
    }

    // Get customer history before creating account (for UI feedback)
    let customerHistory = null;
    try {
      const { data } = await supabase
        .rpc('get_customer_history_for_email', { customer_email: email });
      customerHistory = data;
      console.log('📊 Customer history for account creation:', customerHistory);
    } catch (historyError) {
      console.warn('Could not fetch customer history:', historyError);
      // Don't fail signup for this
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone: phone || null,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("User already registered")) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }
      throw new Error(authError.message || "Failed to create account.");
    }

    if (!authData?.user) {
      throw new Error("Account creation failed. No user data returned.");
    }

    // The database trigger will automatically:
    // 1. Create a profile record
    // 2. Link any existing guest customer record OR create a new customer record
    // 3. Transfer guest data to the new user account

    let transferResults = null;
    
    // If we have a session and the user was created, try to transfer session-based data
    if (sessionId && authData.user?.id && authData.session) {
      try {
        // Wait a moment for the database trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the customer record that was just created/linked
        const { data: linkedCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', authData.user.id)
          .eq('email', email)
          .maybeSingle();

        if (linkedCustomer) {
          const { data: transferData } = await supabase
            .rpc('transfer_guest_data_to_user', {
              guest_customer_id: linkedCustomer.id,
              auth_user_id: authData.user.id,
              session_id_to_transfer: sessionId
            });
          
          transferResults = transferData;
          console.log('✅ Guest data transfer results:', transferResults);
        }
      } catch (transferError) {
        console.warn('⚠️ Could not transfer session data:', transferError);
        // Don't fail the signup for this
      }
    }

    // Auto-login: If we have a session, the user is already logged in
    // If email confirmation is required, authData.session will be null
    const isAutoLoggedIn = !!authData.session;

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      isAutoLoggedIn,
      needsConfirmation: !isAutoLoggedIn,
      customerHistory: customerHistory?.[0] || null,
      transferResults,
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

    // reCAPTCHA token will be verified by the backend
    // For now, we just ensure the token is provided
    console.log('reCAPTCHA token received for signin:', recaptchaToken ? 'Yes' : 'No');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please check your email and confirm your account before signing in.');
      }
      if (error.message.toLowerCase().includes('invalid login credentials') || 
          error.message.toLowerCase().includes('invalid_credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error(error.message || 'Sign in failed.');
    }

    if (!data?.user || !data?.session) {
      throw new Error('Sign in failed. No user data received.');
    }

    // Get customer information
    let customer = null;
    let profile = null;
    
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      customer = customerData;
    } catch (customerError) {
      console.warn('Could not fetch customer data:', customerError);
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = profileData;
    } catch (profileError) {
      console.warn('Could not fetch profile data:', profileError);
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      customer,
      profile,
      message: `Welcome back${customer?.first_name ? `, ${customer.first_name}` : ''}!`
    };

  } catch (error) {
    console.error('Customer signin error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during sign in.'
    };
  }
};

/**
 * Sign out the current user
 */
export const signOutCustomer = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message || 'Sign out failed.');
    }

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
 * Get customer history for an email (useful for showing account creation benefits)
 */
export const getCustomerHistoryByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_history_for_email', { customer_email: email });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      history: data?.[0] || {
        orders_count: 0,
        total_spent: 0,
        last_order_date: null,
        cart_items_count: 0,
        wishlist_items_count: 0
      }
    };

  } catch (error) {
    console.error('Error fetching customer history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch customer history.',
      history: {
        orders_count: 0,
        total_spent: 0,
        last_order_date: null,
        cart_items_count: 0,
        wishlist_items_count: 0
      }
    };
  }
};

/**
 * Check if an email already has an account
 */
export const checkEmailExists = async (email) => {
  try {
    // Check in auth.users via a sign-in attempt with a dummy password
    // This is safer than querying auth.users directly
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy-password-for-check-only'
    });

    // If we get "Invalid login credentials", the email exists but password is wrong
    // If we get "User not found" or similar, the email doesn't exist
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid_credentials')) {
        return { exists: true, isRegistered: true };
      } else {
        return { exists: false, isRegistered: false };
      }
    }

    // This shouldn't happen with a dummy password, but just in case
    return { exists: true, isRegistered: true };

  } catch (error) {
    console.error('Error checking email existence:', error);
    // Default to assuming email doesn't exist to allow sign-up attempt
    return { exists: false, isRegistered: false };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message || 'Failed to send reset email.');
    }

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred sending reset email.'
    };
  }
};

/**
 * Update user password (for logged-in users)
 */
export const updateCustomerPassword = async (newPassword) => {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password.');
    }

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
 */
export const resendEmailConfirmation = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      throw new Error(error.message || 'Failed to resend confirmation email.');
    }

    return {
      success: true,
      message: 'Confirmation email sent. Please check your inbox.'
    };

  } catch (error) {
    console.error('Resend confirmation error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred resending confirmation email.'
    };
  }
}; 