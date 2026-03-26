import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Shield } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const RecaptchaComponent = forwardRef(({ onChange, onError, action = 'submit', className = '' }, ref) => {
  const { settings } = useSettings();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      return;
    }

    try {
      const token = await executeRecaptcha(action);
      setVerified(true);
      setError(null);
      if (onChange) {
        onChange(token);
      }
    } catch (err) {
      console.error('reCAPTCHA v3 error:', err);
      setError('reCAPTCHA verification failed');
      setVerified(false);
      if (onError) {
        onError(err);
      }
    }
  }, [executeRecaptcha, action, onChange, onError]);

  // Auto-execute when reCAPTCHA is ready
  useEffect(() => {
    if (executeRecaptcha && settings.captchaEnabled && !verified) {
      handleVerify();
    }
  }, [executeRecaptcha, settings.captchaEnabled, verified, handleVerify]);

  // Expose reset/execute via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setVerified(false);
      setError(null);
      if (onChange) {
        onChange(null);
      }
    },
    execute: handleVerify,
  }));

  // If captcha is disabled in settings, don't render anything
  if (!settings.captchaEnabled) {
    return null;
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 text-xs text-red-600 ${className}`}>
        <Shield className="w-3 h-3 flex-shrink-0" />
        <span>{error}</span>
        <button type="button" onClick={handleVerify} className="underline ml-1">Retry</button>
      </div>
    );
  }

  // v3 is invisible — show minimal status only while loading
  if (!verified) {
    return (
      <div className={`flex items-center gap-2 p-2 text-xs text-gray-500 ${className}`}>
        <Shield className="w-3 h-3 flex-shrink-0 animate-pulse" />
        <span>Verifying...</span>
      </div>
    );
  }

  // Once verified, render nothing (invisible reCAPTCHA)
  return null;
});

RecaptchaComponent.displayName = 'RecaptchaComponent';

export default RecaptchaComponent;
