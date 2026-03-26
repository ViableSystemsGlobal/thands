import React, { useEffect, useState } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { api } from '@/lib/services/api';

const RecaptchaWrapper = ({ children }) => {
  const [siteKey, setSiteKey] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const response = await api.get('/admin/settings/public');
        if (response.success && response.settings) {
          const dbKey = response.settings.recaptcha_site_key;
          const envKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
          // Prefer DB key, fall back to env var
          setSiteKey(dbKey || envKey || '');
        }
      } catch {
        // Fall back to env var
        setSiteKey(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '');
      } finally {
        setLoaded(true);
      }
    };
    fetchKey();
  }, []);

  if (!loaded) {
    return <>{children}</>;
  }

  if (!siteKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default RecaptchaWrapper;
