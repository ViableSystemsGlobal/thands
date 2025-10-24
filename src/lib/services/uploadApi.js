/**
 * Upload API Service
 * Handles file uploads to local server instead of Supabase storage
 */

// Upload hero image
export const uploadHeroImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:3003/api/upload/hero', {
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
  deleteImage,
  validateFile,
  validateFiles,
  uploadSingle,
  uploadMultiple,
  updateProductImage,
  deleteFile,
  getOptimizedImageUrl
};