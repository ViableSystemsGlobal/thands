import React, { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

const DynamicFavicon = () => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (loading) return;
    
    // Remove all existing favicon links first
    const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach(link => {
      link.remove();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    
    // Only add favicon if one is set in settings
    if (settings?.favicon_url) {
      updateFavicon(settings.favicon_url);
    }
  }, [settings?.favicon_url, loading]);

  const updateFavicon = (faviconUrl) => {
    if (!faviconUrl) {
      // Remove all favicon links if no URL provided
      const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
      existingLinks.forEach(link => {
        link.remove();
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      return;
    }

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach(link => {
      link.remove();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });

    try {
      // Handle both absolute and relative URLs
      let url;
      try {
        url = new URL(faviconUrl);
      } catch (e) {
        url = new URL(faviconUrl, window.location.origin);
      }
      
      // Add aggressive cache busting
      const timestamp = Date.now();
      url.searchParams.set('v', timestamp);
      url.searchParams.set('t', timestamp);
      const finalUrl = url.toString();

      const faviconType = getFaviconType(faviconUrl);

      // Create multiple favicon link types for better browser compatibility
      const linkTypes = [
        { rel: 'icon', type: faviconType },
        { rel: 'shortcut icon', type: faviconType },
        { rel: 'apple-touch-icon', type: faviconType }
      ];

      linkTypes.forEach(({ rel, type }) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.type = type;
        link.href = finalUrl;
        // Insert at the beginning of head for priority
        document.head.insertBefore(link, document.head.firstChild);
      });

      console.log('🎨 DynamicFavicon: Favicon updated:', finalUrl);
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  };

  const getFaviconType = (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ico':
        return 'image/x-icon';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'svg':
        return 'image/svg+xml';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/x-icon';
    }
  };

  return null; // This component doesn't render anything
};

export default DynamicFavicon;
