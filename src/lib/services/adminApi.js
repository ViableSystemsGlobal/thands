import adminApiClient from './adminApiClient';

// Admin Dashboard API
export const getDashboardStats = async (params = {}) => {
  try {
    console.log('🔍 AdminApi: Getting dashboard stats with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const url = `/admin/dashboard?${queryParams.toString()}`;
    console.log('🌐 AdminApi: Making request to:', url);
    
    const response = await adminApiClient.get(url);
    console.log('✅ AdminApi: Dashboard response:', response);
    
    return response.data; // Return the data directly instead of the wrapped response
  } catch (error) {
    console.error('❌ AdminApi: Dashboard error:', error);
    throw error;
  }
};

// Admin Orders API
export const getOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status', params.status);
  if (params.payment_status) queryParams.append('payment_status', params.payment_status);
  if (params.search) queryParams.append('search', params.search);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const response = await adminApiClient.get(`/orders?${queryParams.toString()}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const getOrder = async (id) => {
  const response = await adminApiClient.get(`/orders/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const updateOrderStatus = async (id, status, payment_status) => {
  const response = await adminApiClient.patch(`/orders/${id}/status`, {
    status,
    payment_status
  });
  return response.data; // Return the data directly instead of the wrapped response
};

// Admin Customers API
export const getCustomers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);
  
  const response = await adminApiClient.get(`/customers?${queryParams.toString()}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const getCustomer = async (id) => {
  const response = await adminApiClient.get(`/customers/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const updateCustomer = async (id, customerData) => {
  const response = await adminApiClient.patch(`/customers/${id}`, customerData);
  return response.data; // Return the data directly instead of the wrapped response
};

// Get customer metrics
export const getCustomerMetrics = async () => {
  const response = await adminApiClient.get('/customers/metrics');
  return response.data; // Return the data directly instead of the wrapped response
};

// Admin Products API (using existing products API)
export const getProducts = async (params = {}) => {
  console.log('🔍 AdminApi: getProducts called with params:', params);
  
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('offset', ((params.page - 1) * (params.limit || 50)).toString());
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.category) queryParams.append('category', params.category);
  if (params.active !== undefined) queryParams.append('active', params.active);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/products?${queryParams.toString()}`;
  console.log('🌐 AdminApi: getProducts URL:', url);
  
  const response = await adminApiClient.get(url);
  console.log('✅ AdminApi: getProducts response:', response);
  
  return response.data; // Return the data directly instead of the wrapped response
};

export const getProduct = async (id) => {
  const response = await adminApiClient.get(`/products/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const createProduct = async (productData) => {
  try {
    const response = await adminApiClient.post('/products', productData);
    return response; // Return the response directly since adminApiClient already handles success/error
  } catch (error) {
    console.error('Create product error:', error);
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await adminApiClient.put(`/products/${id}`, productData);
    return response; // Return the response directly since adminApiClient already handles success/error
  } catch (error) {
    console.error('Update product error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProduct = async (id) => {
  const response = await adminApiClient.delete(`/products/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

// Get product metrics
export const getProductMetrics = async () => {
  console.log('🔍 AdminApi: getProductMetrics called');
  const response = await adminApiClient.get('/products/metrics');
  console.log('✅ AdminApi: getProductMetrics response:', response);
  return response.data; // Return the data directly instead of the wrapped response
};

// Admin Consultations API
export const getConsultations = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status', params.status);
  if (params.type) queryParams.append('type', params.type);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);

  const response = await adminApiClient.get(`/consultations?${queryParams.toString()}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const getConsultation = async (id) => {
  const response = await adminApiClient.get(`/consultations/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const updateConsultationStatus = async (id, status) => {
  const response = await adminApiClient.put(`/consultations/${id}`, { status });
  return response.data; // Return the data directly instead of the wrapped response
};

export const deleteConsultation = async (id) => {
  const response = await adminApiClient.delete(`/consultations/${id}`);
  return response.data; // Return the data directly instead of the wrapped response
};

export const bulkDeleteConsultations = async (ids) => {
  const response = await adminApiClient.delete('/consultations', { ids });
  return response.data; // Return the data directly instead of the wrapped response
};

// Get consultation metrics
export const getConsultationMetrics = async () => {
  const response = await adminApiClient.get('/consultations/metrics');
  return response.data; // Return the data directly instead of the wrapped response
};

// Admin Sales API
export const getSalesAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.comparison_start_date) queryParams.append('comparison_start_date', params.comparison_start_date);
  if (params.comparison_end_date) queryParams.append('comparison_end_date', params.comparison_end_date);

  const response = await adminApiClient.get(`/sales/analytics?${queryParams.toString()}`);
  return response.data; // Return the data directly instead of the wrapped response
};
