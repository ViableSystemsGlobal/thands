
import { api } from "@/lib/api";

export const generateSessionId = (context = 'customer') => {
  const key = context === 'admin' ? 'admin_session_id' : 'customer_session_id';
  let existingId = localStorage.getItem(key);
  
  // Migration: If no customer_session_id exists, check for old session_id key
  if (!existingId && context === 'customer') {
    const oldSessionId = localStorage.getItem('session_id');
    if (oldSessionId) {
      console.log(`🛒 generateSessionId (${context}): Migrating old session_id to customer_session_id:`, oldSessionId);
      localStorage.setItem(key, oldSessionId);
      existingId = oldSessionId;
    }
  }
  
  console.log(`🛒 generateSessionId (${context}): Existing ID from localStorage:`, existingId);
  console.log(`🛒 generateSessionId (${context}): All localStorage keys:`, Object.keys(localStorage));
  
  if (existingId) {
    console.log(`🛒 generateSessionId (${context}): Using existing session ID:`, existingId);
    return existingId;
  }
  
  const newId = crypto.randomUUID();
  console.log(`🛒 generateSessionId (${context}): Creating new session ID:`, newId);
  localStorage.setItem(key, newId);
  console.log(`🛒 generateSessionId (${context}): Stored new session ID:`, newId);
  return newId;
};

export const getCustomerDetailsFromDB = async (userId) => {
  if (!userId) return { userId: null, customerId: null };

  try {
    // For registered users, the customer ID is the same as user ID
    // We can verify this by checking if the user exists in our customers table
    const customer = await api.get(`/customers/${userId}`);
    
    return {
      userId, // This is the auth user ID
      customerId: customer?.id || userId // This is the customers table ID
    };
  } catch (error) {
    console.error("Error fetching customer details in ShopContext utils:", error);
    // For guests or if customer doesn't exist, return null customerId
    return {
      userId,
      customerId: null
    };
  }
};
