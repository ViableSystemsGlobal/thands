import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '@/lib/services/authApi';

/**
 * GoogleSignInButton
 * Loads Google Identity Services script and renders the Google sign-in button.
 * Only renders when Google auth is enabled in admin settings.
 *
 * Props:
 *   onCredential(credential) - called with the raw Google ID token when user signs in
 */
const GoogleSignInButton = ({ onCredential }) => {
  const buttonRef = useRef(null);
  const [config, setConfig] = useState(null); // { enabled, clientId }
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Fetch Google config from backend
  useEffect(() => {
    authApi.getGoogleConfig().then(setConfig);
  }, []);

  // Load Google Identity Services script once we have a valid config
  useEffect(() => {
    if (!config?.enabled || !config?.clientId) return;

    // Avoid double-loading
    if (document.getElementById('google-gsi-script')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, [config]);

  // Initialize and render the button once the script is ready
  useEffect(() => {
    if (!scriptLoaded || !config?.clientId || !buttonRef.current) return;

    window.google?.accounts?.id?.initialize({
      client_id: config.clientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
        }
      },
    });

    window.google?.accounts?.id?.renderButton(buttonRef.current, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'continue_with',
      size: 'large',
      width: 400,
    });
  }, [scriptLoaded, config, onCredential]);

  if (!config?.enabled || !config?.clientId) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center w-full">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400 whitespace-nowrap">or continue with</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};

export default GoogleSignInButton;
