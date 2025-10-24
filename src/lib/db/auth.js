
import { supabase } from "@/lib/supabase";

export const loginUser = async (email, password, recaptchaToken = null) => {
  try {
    // Prevent admin login through customer form
    if (email === "admin@tailoredhands.com") {
      throw new Error("Admin users should log in via the admin portal. Please go to /admin/login.");
    }

    // reCAPTCHA token will be verified by the backend
    // For now, we just ensure the token is provided
    console.log('reCAPTCHA token received for login:', recaptchaToken ? 'Yes' : 'No');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      }
      if (authError.message.includes("Email not confirmed")) {
        throw new Error("Login failed. Please check your email and confirm your account before logging in.");
      }
      throw new Error(authError.message || "An unknown login error occurred.");
    }
    if (!authData || !authData.user) {
        throw new Error("Login failed: No user data returned from authentication service.");
    }

    // Fetch profile data instead of customer data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id) 
      .single();

    if (profileError && profileError.code !== 'PGRST116') { 
      console.error("Login successful, but failed to fetch profile details for user:", authData.user.id, profileError);
      throw new Error("Login successful, but we couldn't retrieve your profile. Please contact support.");
    }
    
    if (!profile) {
       console.warn("Login successful, but no profile record found for user:", authData.user.id);
       // This might be okay if profile creation is slightly delayed or if admin doesn't have one
    }


    return {
      user: authData.user,
      profile: profile || null, 
    };
  } catch (error) {
    console.error("Login user error in auth.js:", error);
    throw error; 
  }
};

export const signupUser = async ({ email, password, firstName, lastName, phone, recaptchaToken = null }) => {
  try {
    if (email === "admin@tailoredhands.com") {
      throw new Error("This email is reserved. Please use a different email for customer signup.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // reCAPTCHA token will be verified by the backend
    // For now, we just ensure the token is provided
    console.log('reCAPTCHA token received for signup:', recaptchaToken ? 'Yes' : 'No');

    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName, // Pass full_name for the trigger
          first_name: firstName, // Keep for potential other uses or if full_name is not preferred
          last_name: lastName,
          phone: phone,
        },
      },
    });

    if (authError) {
       if (authError.message.includes("User already registered")) {
        throw new Error("An account with this email already exists. Please log in or use a different email.");
      }
      throw new Error(authError.message || "An unknown signup error occurred.");
    }
    
    if (!authData || !authData.user || !authData.user.id) {
        throw new Error("Signup successful, but no user data returned from authentication.");
    }

    // The trigger 'on_auth_user_created' will now handle inserting into 'profiles'.
    // The old 'customers' table insertion is removed.
    // We still need to insert into the 'customers' table for existing customer-specific logic.
    // If 'profiles' is meant to replace 'customers' entirely for user-related data,
    // then this 'customers' insert should be removed. For now, keeping it for compatibility.
    const { error: customerError } = await supabase.from("customers").insert([
      {
        id: authData.user.id, 
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (customerError) {
      console.error("Customer record creation failed after signup (this is separate from profiles table):", customerError);
      // This error is less critical if profiles table is the main source of user data
    }


    return authData.user; 
  } catch (error) {
    console.error("Signup user error in auth.js:", error);
    throw error; 
  }
};
