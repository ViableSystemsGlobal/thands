const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003';
const UPLOAD_URL = `${API_BASE}/api/upload`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const uploadProductImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${UPLOAD_URL}/single`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `Upload failed: HTTP ${response.status}` };
    }

    const data = await response.json();
    const url = data.url || data.imageUrl || data.image_url;

    if (!url) {
      return { error: 'Failed to get public URL for uploaded image' };
    }

    return { url };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: `Failed to upload image: ${error.message}` };
  }
};

export const deleteProductImage = async (imageUrl) => {
  // Deletion of backend-stored images is not required from the frontend
  console.log('deleteProductImage: no-op for backend-stored image', imageUrl);
};

export const uploadHeroImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${UPLOAD_URL}/hero`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `Upload failed: HTTP ${response.status}` };
    }

    const data = await response.json();
    const url = data.url || data.imageUrl || data.image_url;

    if (!url) {
      return { error: 'Failed to get public URL for uploaded hero image' };
    }

    return { url };
  } catch (error) {
    console.error('Hero image upload error:', error);
    return { error: `Failed to upload hero image: ${error.message}` };
  }
};

export const deleteHeroImage = async (imageUrl) => {
  // Deletion of backend-stored images is not required from the frontend
  console.log('deleteHeroImage: no-op for backend-stored image', imageUrl);
};
