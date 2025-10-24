import React, { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

const DynamicFavicon = () => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (!loading && settings?.favicon_url) {
      updateFavicon(settings.favicon_url);
    }
  }, [settings?.favicon_url, loading]);

  const updateFavicon = (faviconUrl) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = getFaviconType(faviconUrl);
    link.href = faviconUrl;
    
    // Add cache busting parameter
    const url = new URL(faviconUrl);
    url.searchParams.set('v', Date.now());
    link.href = url.toString();

    document.head.appendChild(link);

    // Also add apple-touch-icon for mobile devices
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = url.toString();
    document.head.appendChild(appleLink);

    console.log('🎨 Favicon updated:', faviconUrl);
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
