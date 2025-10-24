// Comprehensive validation utilities
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  address: {
    required: true,
    minLength: 5,
    maxLength: 200,
    message: 'Address must be 5-200 characters'
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'City must be 2-50 characters'
  },
  postalCode: {
    required: true,
    pattern: /^[a-zA-Z0-9\s-]{3,10}$/,
    message: 'Please enter a valid postal code'
  },
  password: {
    required: true,
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 6 characters with uppercase, lowercase, and number'
  },
  orderNotes: {
    required: false,
    maxLength: 500,
    message: 'Order notes must be less than 500 characters'
  }
};

export const validateField = (name, value, rules = validationRules) => {
  const rule = rules[name];
  if (!rule) return { isValid: true, message: '' };

  // Check required
  if (rule.required && (!value || value.trim() === '')) {
    return { isValid: false, message: `${name.charAt(0).toUpperCase() + name.slice(1)} is required` };
  }

  // Skip other validations if not required and empty
  if (!rule.required && (!value || value.trim() === '')) {
    return { isValid: true, message: '' };
  }

  // Check min length
  if (rule.minLength && value.length < rule.minLength) {
    return { isValid: false, message: `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters` };
  }

  // Check max length
  if (rule.maxLength && value.length > rule.maxLength) {
    return { isValid: false, message: `${name.charAt(0).toUpperCase() + name.slice(1)} must be less than ${rule.maxLength} characters` };
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    return { isValid: false, message: rule.message || 'Invalid format' };
  }

  return { isValid: true, message: '' };
};

export const validateForm = (formData, rules = validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(formData).forEach(fieldName => {
    const validation = validateField(fieldName, formData[fieldName], rules);
    if (!validation.isValid) {
      errors[fieldName] = validation.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};
