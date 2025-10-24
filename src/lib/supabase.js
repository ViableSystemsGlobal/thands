// Supabase has been disabled - using custom backend API instead
// This file is kept for compatibility but will not initialize Supabase

console.warn('⚠️ Supabase is disabled. Using custom backend API instead.');

export const supabase = {
  // Mock supabase object to prevent errors
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    signUp: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    getUser: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    signOut: () => Promise.reject(new Error('Supabase disabled - use backend API')),
  },
  from: () => ({
    select: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    insert: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    update: () => Promise.reject(new Error('Supabase disabled - use backend API')),
    delete: () => Promise.reject(new Error('Supabase disabled - use backend API')),
  }),
};
