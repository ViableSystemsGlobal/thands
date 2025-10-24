import adminApiClient from '@/lib/services/adminApiClient';
import { api } from '@/lib/services/api';

export const fetchIssuedGiftVouchersForAdmin = async (filters) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== "all") {
      params.append('status', filters.status);
    }
    
    if (filters.searchTerm) {
      params.append('search', filters.searchTerm);
    }
    
    // Add pagination if provided
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await adminApiClient.get(`/gift-vouchers/issued?${params.toString()}`);
    return response.data?.vouchers || response.vouchers || response.data || [];
  } catch (error) {
    console.error('Error fetching issued gift vouchers:', error);
    throw error;
  }
};

export const updateIssuedGiftVoucherStatus = async (id, newStatus) => {
  try {
    const response = await adminApiClient.put(`/gift-vouchers/${id}/status`, { status: newStatus });
    return response.data || response;
  } catch (error) {
    console.error('Error updating gift voucher status:', error);
    throw error;
  }
};

export const fetchGiftVoucherByCode = async (code) => {
  try {
    const response = await api.get(`/gift-vouchers/validate/${code}`);
    return response.data || response;
  } catch (error) {
    console.error('Error fetching gift voucher by code:', error);
    return null; // Return null if not found (same as maybeSingle())
  }
};

export const redeemGiftVoucher = async (voucherId, redeemAmount) => {
  try {
    const response = await api.post(`/gift-vouchers/${voucherId}/redeem`, { 
      amount: redeemAmount 
    });
    return response.data || response;
  } catch (error) {
    console.error('Error redeeming gift voucher:', error);
    throw error;
  }
};

export const createGiftVoucher = async (voucherData) => {
  try {
    const response = await adminApiClient.post('/gift-vouchers/issued', voucherData);
    return response.data || response;
  } catch (error) {
    console.error('Error creating gift voucher:', error);
    throw error;
  }
};
