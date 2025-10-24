import { api } from '@/lib/services/api';
import adminApiClient from '@/lib/services/adminApiClient';

export const fetchFAQsByProductId = async (productId) => {
  try {
    const data = await api.get(`/faqs/product/${productId}`);
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching FAQs by product ID:', error.message);
    return { data: null, error };
  }
};

export const fetchGeneralFAQs = async () => {
  try {
    const data = await api.get('/faqs/general');
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching general FAQs:', error.message);
    return { data: null, error };
  }
};

export const fetchAllFAQsForAdmin = async () => {
  try {
    const response = await adminApiClient.get('/faqs');
    return response.data || response;
  } catch (error) {
    console.error('Error fetching all FAQs for admin:', error.message);
    throw error;
  }
};

export const addFAQ = async (faqData) => {
  try {
    const response = await adminApiClient.post('/faqs', faqData);
    return response.data || response;
  } catch (error) {
    console.error('Error adding FAQ:', error.message);
    throw error;
  }
};

export const deleteFAQ = async (faqId) => {
  try {
    await adminApiClient.delete(`/faqs/${faqId}`);
    return true;
  } catch (error) {
    console.error('Error deleting FAQ:', error.message);
    throw error;
  }
};
