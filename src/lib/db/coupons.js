import adminApiClient from '@/lib/services/adminApiClient';

export const fetchAllCoupons = async () => {
  try {
    const response = await adminApiClient.get('/coupons');
    return response.data || response;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};

export const addCoupon = async (couponData) => {
  try {
    const response = await adminApiClient.post('/coupons', couponData);
    return response.data || response;
  } catch (error) {
    console.error('Error adding coupon:', error);
    throw error;
  }
};

export const updateCoupon = async (id, couponData) => {
  try {
    const response = await adminApiClient.put(`/coupons/${id}`, couponData);
    return response.data || response;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

export const deleteCoupon = async (id) => {
  try {
    await adminApiClient.delete(`/coupons/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};
