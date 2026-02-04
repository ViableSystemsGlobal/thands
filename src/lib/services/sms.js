import { API_BASE_URL } from './api';

/**
 * SMS Service using Deywuro API
 * Based on: https://www.deywuro.com/NewUI/Landing/images/NPONTU_SMS_API_DOCUMENT_NEW.pdf
 */

// SMS Configuration
const SMS_CONFIG = {
  apiUrl: 'https://deywuro.com/api/sms',
  // These should be stored in environment variables or database
  defaultUsername: '',
  defaultPassword: '',
  defaultSource: 'T-Hands' // Max 11 characters (7 chars) - should be set in admin settings
};

/**
 * Send SMS using Backend API (routes through Deywuro)
 * @param {Object} smsData - SMS data object
 * @param {string} smsData.destination - Phone numbers (comma separated)
 * @param {string} smsData.source - Sender name (max 11 chars)
 * @param {string} smsData.message - SMS content
 * @returns {Promise<Object>} API response
 */
export const sendSMS = async (smsData) => {
  try {
    const {
      destination,
      source = SMS_CONFIG.defaultSource,
      message
    } = smsData;

    // Validate required fields
    if (!destination || !message) {
      throw new Error('Destination and message are required');
    }

    // Validate source length (max 11 characters)
    if (source && source.length > 11) {
      throw new Error('Source must be 11 characters or less');
    }

    console.log('📱 SMS Service: Sending SMS via backend API');
    console.log('📱 SMS Service: Destination:', destination);
    console.log('📱 SMS Service: Source:', source);
    console.log('📱 SMS Service: Message length:', message.length);

    // Use backend API to send SMS (handles credentials securely)
    const response = await fetch(`${API_BASE_URL}/notifications/send/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination,
        source,
        message
      })
    });

    const result = await response.json();
    
    console.log('📱 SMS Service: Backend API Response:', result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.details || 'SMS sending failed');
    }

    return {
      success: true,
      message: result.message || 'SMS sent successfully'
    };

  } catch (error) {
    console.error('📱 SMS Service Error:', error);
    throw error;
  }
};

/**
 * Send SMS through our backend (recommended for production)
 * @param {Object} smsData - SMS data object
 * @returns {Promise<Object>} API response
 */
export const sendSMSViaBackend = async (smsData) => {
  try {
    console.log('📱 SMS Service: Sending SMS via backend');
    
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_auth_token')}`
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📱 SMS Service: Backend response:', result);
    return result;

  } catch (error) {
    console.error('📱 SMS Service Backend Error:', error);
    throw error;
  }
};

/**
 * Get SMS configuration status
 * @returns {Object} Configuration status
 */
export const getSMSConfigStatus = () => {
  const hasCredentials = !!(SMS_CONFIG.defaultUsername && SMS_CONFIG.defaultPassword);
  
  return {
    configured: hasCredentials,
    apiUrl: SMS_CONFIG.apiUrl,
    source: SMS_CONFIG.defaultSource,
    hasCredentials
  };
};

/**
 * Test SMS configuration
 * @param {Object} testData - Test SMS data
 * @returns {Promise<Object>} Test result
 */
export const testSMS = async (testData) => {
  try {
    console.log('📱 SMS Service: Testing SMS configuration');
    
    // Use backend test endpoint if available, otherwise direct API
    const response = await fetch(`${API_BASE_URL}/sms/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_auth_token')}`
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      // Fallback to direct API call
      return await sendSMS(testData);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('📱 SMS Service Test Error:', error);
    throw error;
  }
};

/**
 * Format phone number for Ghana
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatGhanaPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('233')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '233' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '233' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Ghana mobile numbers should be 12 digits (233 + 9 digits)
  return cleaned.length === 12 && cleaned.startsWith('233');
};

/**
 * Parse multiple phone numbers
 * @param {string} phoneNumbers - Comma-separated phone numbers
 * @returns {Array} Array of formatted phone numbers
 */
export const parsePhoneNumbers = (phoneNumbers) => {
  if (!phoneNumbers) return [];
  
  return phoneNumbers
    .split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0)
    .map(phone => formatGhanaPhoneNumber(phone));
};