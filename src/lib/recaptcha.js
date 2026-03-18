/**
 * Server-side reCAPTCHA verification utility
 * Validates reCAPTCHA tokens against Google's verification API
 */

const RECAPTCHA_SECRET_KEY = typeof process !== 'undefined' ? process.env.RECAPTCHA_SECRET_KEY : null;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} remoteip - The user's IP address (optional)
 * @returns {Promise<{success: boolean, error?: string, score?: number}>}
 */
export async function verifyRecaptchaToken(token, remoteip = null) {
  try {
    if (!RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return {
        success: false,
        error: 'reCAPTCHA is not properly configured on the server'
      };
    }

    if (!token) {
      return {
        success: false,
        error: 'No reCAPTCHA token provided'
      };
    }

    // Prepare the request body
    const requestBody = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    // Add IP address if provided
    if (remoteip) {
      requestBody.append('remoteip', remoteip);
    }

    // Make the verification request
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Check the response
    if (result.success) {
      return {
        success: true,
        score: result.score, // For reCAPTCHA v3 (not used in v2)
        action: result.action, // For reCAPTCHA v3 (not used in v2)
        challenge_ts: result.challenge_ts,
        hostname: result.hostname
      };
    } else {
      // Handle specific error codes
      const errorMessages = {
        'missing-input-secret': 'The secret parameter is missing',
        'invalid-input-secret': 'The secret parameter is invalid or malformed',
        'missing-input-response': 'The response parameter is missing',
        'invalid-input-response': 'The response parameter is invalid or malformed',
        'bad-request': 'The request is invalid or malformed',
        'timeout-or-duplicate': 'The response is no longer valid: either is too old or has been used previously'
      };

      const errorCode = result['error-codes'] && result['error-codes'][0];
      const errorMessage = errorMessages[errorCode] || 'reCAPTCHA verification failed';

      return {
        success: false,
        error: errorMessage,
        errorCodes: result['error-codes']
      };
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA. Please try again.'
    };
  }
}

/**
 * Middleware-style function to verify reCAPTCHA in authentication flows
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} remoteip - The user's IP address (optional)
 * @returns {Promise<boolean>} - Whether verification was successful
 */
export async function requireRecaptchaVerification(token, remoteip = null) {
  const result = await verifyRecaptchaToken(token, remoteip);
  
  if (!result.success) {
    throw new Error(result.error || 'reCAPTCHA verification failed');
  }
  
  return true;
}

/**
 * Development helper - bypasses reCAPTCHA in development mode
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} remoteip - The user's IP address (optional)
 * @returns {Promise<boolean>} - Whether verification was successful
 */
export async function verifyRecaptchaWithDevMode(token, remoteip = null) {
  // Never bypass reCAPTCHA in production, regardless of env vars
  const isProduction = import.meta.env.MODE === 'production';
  if (isProduction) {
    return requireRecaptchaVerification(token, remoteip);
  }

  // In non-production environments, allow bypass only when explicitly configured
  const isDevelopment = import.meta.env.MODE === 'development';
  const skipRecaptchaInDev = process.env.SKIP_RECAPTCHA_IN_DEV === 'true';

  if (isDevelopment && skipRecaptchaInDev) {
    console.warn('⚠️  reCAPTCHA verification skipped in development mode');
    return true;
  }

  return requireRecaptchaVerification(token, remoteip);
}

/**
 * Verify reCAPTCHA token with settings check
 * @param {string} token - The reCAPTCHA token from the client
 * @param {boolean} captchaEnabled - Whether captcha is enabled in settings
 * @param {string} remoteip - The user's IP address (optional)
 * @returns {Promise<{success: boolean, error?: string, score?: number}>}
 */
export async function verifyRecaptchaWithSettings(token, captchaEnabled, remoteip = null) {
  // If captcha is disabled in settings, always return success
  if (!captchaEnabled) {
    console.log('reCAPTCHA verification skipped - captcha is disabled in settings');
    return {
      success: true,
      score: 1.0,
      action: 'bypass',
      challenge_ts: new Date().toISOString(),
      hostname: 'settings-disabled'
    };
  }
  
  // If captcha is enabled but no token provided, return error
  if (!token) {
    return {
      success: false,
      error: 'No reCAPTCHA token provided'
    };
  }
  
  // Proceed with normal verification
  return verifyRecaptchaToken(token, remoteip);
}

// Export the verification function as default
export default verifyRecaptchaToken; 