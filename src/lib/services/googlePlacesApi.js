import { api } from './api';

export const googlePlacesApi = {
  // Get Google Places API key from backend
  getApiKey: async () => {
    try {
      const response = await api.get('/settings/google-places-api-key');
      return response.data?.google_places_api_key || null;
    } catch (error) {
      console.error('Error fetching Google Places API key:', error);
      return null;
    }
  },

  // Load Google Maps API with API key
  loadGoogleMapsApi: async (apiKey) => {
    return new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
        // Wait for it to load
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            resolve(window.google);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          console.log('✅ Google Maps API loaded successfully');
          resolve(window.google);
        } else {
          reject(new Error('Google Maps API failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  }
};
