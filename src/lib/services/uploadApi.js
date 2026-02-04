/**
 * Upload API Service
 * Handles file uploads to local server instead of Supabase storage
 */

// Upload hero image
export const uploadHeroImage = async (file) => {
  try {
    // Handle both file objects and FormData
    let formData;
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('image', file);
    }

    const token = localStorage.getItem('admin_auth_token');
    if (!token) {
      throw new Error('Admin authentication required');
    }

    console.log('📤 Uploading to /api/upload/hero, file type:', file instanceof FormData ? 'FormData' : file?.type);

    const response = await fetch('http://localhost:3003/api/upload/hero', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 Upload response:', result);
    return { 
      success: result.success !== false, 
      imageUrl: result.imageUrl || result.url,
      url: result.url || result.imageUrl
    };
  } catch (error) {
    console.error('Hero image upload error:', error);
    return { error: error.message, success: false };
  }
};

// Upload collection image
export const uploadCollectionImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:3003/api/upload/collection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_auth_token')}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    return { 
      success: result.success, 
      imageUrl: result.imageUrl || result.url 
    };
  } catch (error) {
    console.error('Collection image upload error:', error);
    return { error: error.message, success: false };
  }
};

// Upload product image
export const uploadProductImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('admin_auth_token');
    if (!token) {
      throw new Error('Admin authentication required');
    }

    const response = await fetch('http://localhost:3003/api/upload/single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // The backend returns { file: { processedImages: { original: { url: ... } } } }
    const imageUrl = result.file?.processedImages?.original?.url || 
                     result.file?.url || 
                     result.url || 
                     result.imageUrl;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from server');
    }

    return { 
      success: true, 
      url: imageUrl,
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error('Product image upload error:', error);
    return { error: error.message, success: false };
  }
};

// Delete product image
export const deleteProductImage = async (imageUrl) => {
  try {
    if (!imageUrl) return { success: true };

    // Extract file ID from URL (format: /uploads/products/original/{id}-original.webp)
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const fileId = fileName.split('-')[0];

    if (!fileId) {
      console.warn('Could not extract file ID from URL:', imageUrl);
      return { success: true }; // Don't fail if we can't delete
    }

    const token = localStorage.getItem('admin_auth_token');
    if (!token) {
      throw new Error('Admin authentication required');
    }

    const response = await fetch(`http://localhost:3003/api/upload/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
      console.warn('Delete error:', errorData);
      // Don't throw - just log the warning
      return { success: false, error: errorData.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Product image delete error:', error);
    // Don't throw - just return error
    return { success: false, error: error.message };
  }
};

// Delete image
export const deleteImage = async (imageUrl) => {
  try {
    // Extract the filename from the URL
    const filename = imageUrl.split('/').pop();
    
    const response = await fetch(`/api/upload/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Delete failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return { error: error.message };
  }
};

// Additional functions for useFileUpload compatibility
export const validateFile = (file) => {
  return {
    isValid: true,
    errors: []
  };
};

export const validateFiles = (files) => {
  return {
    allValid: true,
    validFiles: files,
    invalidFiles: []
  };
};

export const uploadSingle = async (file) => {
  // For now, just return a mock response
  return { success: true, url: 'mock-url' };
};

export const uploadMultiple = async (files) => {
  return { success: true, urls: ['mock-url'] };
};

export const updateProductImage = async (productId, file) => {
  return { success: true, url: 'mock-url' };
};

export const deleteFile = async (fileId) => {
  return { success: true };
};

export const getOptimizedImageUrl = (fileId, useCase = 'display') => {
  return `mock-url-${fileId}`;
};

// Individual functions are already exported above

// Default export as an object
export default {
  uploadHeroImage,
  uploadCollectionImage,
  uploadProductImage,
  deleteProductImage,
  deleteImage,
  validateFile,
  validateFiles,
  uploadSingle,
  uploadMultiple,
  updateProductImage,
  deleteFile,
  getOptimizedImageUrl
};