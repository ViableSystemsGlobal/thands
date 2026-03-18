import { api } from '@/lib/services/api';

export const fetchAllProducts = async () => {
  const data = await api.get('/products?limit=1000');
  const products = data.products || data || [];
  return products.map(p => ({ ...p, base_price: p.product_sizes?.[0]?.price || p.base_price || 0 }));
};

export const fetchProductById = async (id) => {
  const data = await api.get(`/products/${id}`);
  const product = data.product || data;
  return { ...product, base_price: product.product_sizes?.[0]?.price || product.base_price || 0 };
};

export const addProduct = async (productData, sizesData) => {
  const payload = { ...productData };
  if (sizesData && sizesData.length > 0) {
    payload.sizes = sizesData;
  }
  const data = await api.post('/products', payload);
  return data.product || data;
};

export const updateProduct = async (id, productData, sizesData) => {
  const payload = { ...productData };
  if (sizesData && sizesData.length > 0) {
    payload.sizes = sizesData;
  }
  const data = await api.put(`/products/${id}`, payload);
  return data.product || data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};

export const fetchFeaturedProducts = async () => {
  const data = await api.get('/products?featured=true&limit=8');
  const products = data.products || data || [];
  return products.map(p => ({ ...p, base_price: p.product_sizes?.[0]?.price || p.base_price || 0 }));
};

export const fetchProductsByCategory = async (category) => {
  const data = await api.get(`/products?category=${encodeURIComponent(category)}`);
  const products = data.products || data || [];
  return products.map(p => ({ ...p, base_price: p.product_sizes?.[0]?.price || p.base_price || 0 }));
};
