/**
 * Customer DB helpers — migrated from Supabase to backend API.
 * All operations now go through the REST API (src/lib/services/customerApi.js).
 * This file is kept for backward compatibility but new code should import from customerApi directly.
 */
import { customerApi } from '@/lib/services/customerApi';

export const updateCustomerDetails = async (customerId, customerData) => {
  return await customerApi.updateCustomerDetails(customerId, customerData);
};

export const getOrCreateCustomer = async (customerData, attemptAccountCreation = false) => {
  return await customerApi.getOrCreateCustomer(customerData, attemptAccountCreation);
};

export const createNewGuestCustomerRecord = async (customerData) => {
  return await customerApi.createGuestCustomer(customerData);
};

// Account creation during checkout is no longer supported via this helper.
// Use the /signup page or POST /api/auth/register instead.
export const createNewAuthUserAndCustomer = async (customerData) => {
  throw new Error(
    'Account creation during checkout is not supported. Please use the signup page.'
  );
};
