import { api } from '@/lib/services/api';

export const fetchOrdersForAdmin = async (filters) => {
  const { dateRange, statusFilter, searchQuery } = filters;

  const queryParams = new URLSearchParams();

  if (dateRange?.start) {
    queryParams.set('dateStart', dateRange.start.toISOString());
  }
  if (dateRange?.end) {
    queryParams.set('dateEnd', dateRange.end.toISOString());
  }
  if (statusFilter && statusFilter !== 'all') {
    queryParams.set('status', statusFilter);
  }
  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
    queryParams.set('search', searchQuery.trim().slice(0, 100));
  }

  try {
    const data = await api.get(`/orders?${queryParams.toString()}`);
    return data.orders || data || [];
  } catch (error) {
    console.error('fetchOrdersForAdmin error:', error);
    throw error;
  }
};

export const fetchOrderByIdForAdmin = async (orderId) => {
  const data = await api.get(`/orders/${orderId}`);
  return data.order || data;
};

export const updateOrderStatusForAdmin = async (orderId, status) => {
  const data = await api.put(`/orders/${orderId}`, { status });
  return data.order || data;
};

export const fetchOrdersByUserId = async (userId) => {
  try {
    const data = await api.get(`/orders?userId=${userId}`);
    return data.orders || data || [];
  } catch (error) {
    console.error('fetchOrdersByUserId error:', error);
    return [];
  }
};
