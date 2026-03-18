/**
 * Utility functions for handling image URLs
 */
import { API_BASE_URL } from '@/lib/services/api';

// Backend origin (strip the /api suffix)
const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * Constructs the full image URL for local images with optimization
 * @param {string} imagePath - The image path from database (e.g., "products/filename.png")
 * @param {string} size - Size preference: 'thumb', 'medium', 'large', 'original'
 * @returns {string} - The full URL to access the image
 */
export const getImageUrl = (imagePath, size = 'medium') => {
  if (!imagePath) return null;
  
  // If it's already a full URL (including Supabase or other external URLs), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // For local API images, construct the URL pointing to backend server
  const backendUrl = BACKEND_URL;
  
  // Remove leading slash if present to avoid double slashes
  let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Remove 'uploads/' prefix if present since /api/images already serves from uploads directory
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.substring('uploads/'.length);
  }
  
  // Add size parameter for optimization
  const sizeParam = size && size !== 'original' ? `?size=${size}` : '';
  
  return `${backendUrl}/api/images/${cleanPath}${sizeParam}`;
};

/**
 * Get optimized image URLs for different contexts
 */
export const getOptimizedImageUrls = (imagePath) => {
  if (!imagePath) return null;
  
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com'
    : 'http://localhost:3003';
  
  return {
    thumbnail: `${backendUrl}/api/images/${imagePath}?size=thumb`,
    medium: `${backendUrl}/api/images/${imagePath}?size=medium`,
    large: `${backendUrl}/api/images/${imagePath}?size=large`,
    original: `${backendUrl}/api/images/${imagePath}?size=original`
  };
};

/**
 * Gets a placeholder image URL
 * @returns {string} - Placeholder image URL
 */
export const getPlaceholderImageUrl = () => {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
};
