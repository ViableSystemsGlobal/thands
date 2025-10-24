import React, { forwardRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AlertCircle, Shield } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const RecaptchaComponent = forwardRef(({ onChange, onError, theme = 'light', size = 'normal', className = '' }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mockVerified, setMockVerified] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const { settings } = useSettings();

  // If captcha is disabled in settings, don't render anything
  if (!settings.captchaEnabled) {
    return null;
  }

  useEffect(() => {
    // Check if reCAPTCHA is properly configured
    if (!siteKey || siteKey === 'your-recaptcha-site-key-here') {
      console.warn('reCAPTCHA site key not configured. Using test mode.');
      // For development, we'll show a mock reCAPTCHA
      setIsLoaded(true);
      return;
    }

    // Check if reCAPTCHA script is loaded
    if (typeof window !== 'undefined' && window.grecaptcha) {
      setIsLoaded(true);
    } else {
      // Wait for reCAPTCHA to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkLoaded = () => {
        if (window.grecaptcha) {
          setIsLoaded(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkLoaded, 100);
        } else {
          setError('reCAPTCHA failed to load. Please refresh the page.');
        }
      };
      checkLoaded();
    }
  }, [siteKey]);

  const handleChange = (token) => {
    if (onChange) {
      onChange(token);
    }
  };

  const handleMockVerify = () => {
    const token = 'test-token-' + Date.now();
    setMockVerified(true);
    if (onChange) {
      onChange(token);
    }
  };

  const handleMockReset = () => {
    setMockVerified(false);
    if (onChange) {
      onChange(null);
    }
  };

  // Expose reset function via ref
  React.useImperativeHandle(ref, () => ({
    reset: () => {
      setMockVerified(false);
      if (onChange) {
        onChange(null);
      }
    }
  }));

  const handleError = (error) => {
    console.error('reCAPTCHA error:', error);
    setError('reCAPTCHA verification failed. Please try again.');
    if (onError) {
      onError(error);
    }
  };

  const handleExpired = () => {
    console.warn('reCAPTCHA expired');
    if (onChange) {
      onChange(null);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className={`flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className={`flex items-center gap-2 p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <Shield className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span>Loading reCAPTCHA...</span>
      </div>
    );
  }

  // Show reCAPTCHA
  if (!siteKey || siteKey === 'your-recaptcha-site-key-here') {
    // Mock reCAPTCHA for development
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="flex items-center gap-2 p-3 text-sm border rounded-md">
          <Shield className="w-4 h-4 flex-shrink-0" />
          {mockVerified ? (
            <>
              <span className="text-green-700 bg-green-50">✓ Verified (Test Mode)</span>
              <button
                type="button"
                onClick={handleMockReset}
                className="ml-2 px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
              >
                Reset
              </button>
            </>
          ) : (
            <>
              <span className="text-blue-700 bg-blue-50">reCAPTCHA Test Mode - Click to verify</span>
              <button
                type="button"
                onClick={handleMockVerify}
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Verify
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <ReCAPTCHA
        ref={ref}
        sitekey={siteKey}
        onChange={handleChange}
        onError={handleError}
        onExpired={handleExpired}
        theme={theme}
        size={size}
        aria-label="reCAPTCHA verification"
      />
    </div>
  );
});

RecaptchaComponent.displayName = 'RecaptchaComponent';

export default RecaptchaComponent; 