import { api } from '../api';

// Sales Analytics API
export const getSalesAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.comparison_start_date) queryParams.append('comparison_start_date', params.comparison_start_date);
  if (params.comparison_end_date) queryParams.append('comparison_end_date', params.comparison_end_date);

  const response = await api.get(`/sales/analytics?${queryParams.toString()}`);
  return response;
};
