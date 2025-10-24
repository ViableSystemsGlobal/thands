import { api } from '@/lib/services/api';
import adminApiClient from '@/lib/services/adminApiClient';

export const fetchGiftVoucherTypes = async () => {
  try {
    const response = await adminApiClient.get('/gift-vouchers/types');
    return response.data || response || [];
  } catch (error) {
    console.error('Error fetching gift voucher types:', error);
    throw error;
  }
};

export const addGiftVoucherType = async (payload) => {
  try {
    const response = await adminApiClient.post('/gift-vouchers/types', payload);
    return response.data || response;
  } catch (error) {
    console.error('Error adding gift voucher type:', error);
    throw error;
  }
};

export const updateGiftVoucherType = async (id, payload) => {
  try {
    const response = await adminApiClient.put(`/gift-vouchers/types/${id}`, payload);
    return response.data || response;
  } catch (error) {
    console.error('Error updating gift voucher type:', error);
    throw error;
  }
};

export const deleteGiftVoucherType = async (id) => {
  try {
    await adminApiClient.delete(`/gift-vouchers/types/${id}`);
  } catch (error) {
    console.error('Error deleting gift voucher type:', error);
    throw error;
  }
};

export const fetchActiveGiftVoucherTypes = async () => {
  try {
    const data = await api.get('/gift-vouchers/types?is_active=true');
    return data || [];
  } catch (error) {
    console.error('Error fetching active gift voucher types:', error);
    throw error;
  }
};

export const fetchGiftVoucherTypeById = async (id) => {
  try {
    const response = await adminApiClient.get(`/gift-vouchers/types/${id}`);
    return response.data || response;
  } catch (error) {
    console.error('Error fetching gift voucher type by id:', error);
    throw error;
  }
};
