import { api } from '@/lib/services/api';

export const loginUser = async (email, password, recaptchaToken = null) => {
  try {
    if (email === "admin@tailoredhands.com") {
      // Allow admin login through this path, handled by backend role check
    }

    console.log('reCAPTCHA token received for login:', recaptchaToken ? 'Yes' : 'No');

    const data = await api.post('/auth/login', { email, password });

    if (!data || !data.user) {
      throw new Error("Login failed: No user data returned from authentication service.");
    }

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }

    return {
      user: data.user,
      profile: data.user,
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

    console.log('reCAPTCHA token received for signup:', recaptchaToken ? 'Yes' : 'No');

    const data = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    if (!data || !data.user) {
      throw new Error("Signup successful, but no user data returned from authentication.");
    }

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }

    return data.user;
  } catch (error) {
    console.error("Signup user error in auth.js:", error);
    throw error;
  }
};
