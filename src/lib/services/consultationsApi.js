import { api } from '@/lib/services/api';
import adminApiClient from '@/lib/services/adminApiClient';

export const consultationsApi = {
  // Get all consultations (Admin only)
  async getConsultations(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await adminApiClient.get(`/consultations?${queryParams.toString()}`);
    return response.data || response;
  },

  // Get single consultation (Admin only)
  async getConsultation(id) {
    const response = await adminApiClient.get(`/consultations/${id}`);
    return response.data || response;
  },

  // Create consultation (Public)
  async createConsultation(consultationData) {
    const response = await api.post('/consultations', consultationData);
    return response;
  },

  // Update consultation (Admin only)
  async updateConsultation(id, updates) {
    const response = await adminApiClient.put(`/consultations/${id}`, updates);
    return response.data || response;
  },

  // Delete consultation (Admin only)
  async deleteConsultation(id) {
    const response = await adminApiClient.delete(`/consultations/${id}`);
    return response.data || response;
  }
};

export default consultationsApi;
