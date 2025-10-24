// SMS service - temporarily disabled until backend SMS config is implemented
export async function getSMSConfig() {
  try {
    // TODO: Implement SMS config endpoint in backend
    // For now, return default config or disable SMS
    console.log('📱 SMS service temporarily disabled - backend config not implemented yet');
    return null;
  } catch (error) {
    console.error('Error fetching SMS config:', error);
    throw error;
  }
}

export async function sendSMS({ destination, message }) {
  try {
    const config = await getSMSConfig();
    if (!config) {
      console.log('📱 SMS service disabled - skipping SMS send to', destination);
      return { success: true, message: 'SMS service disabled' };
    }

    let response;

    // Twilio SMS
    if (config.service === 'Twilio' && config.account_sid && config.auth_token) {
      const body = new URLSearchParams({
        To: destination,
        From: config.from_number,
        Body: message
      });

      response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.account_sid}:${config.auth_token}`)}`
        },
        body: body
      });
    }
    // Africa's Talking SMS (popular in Africa, good for Ghana)
    else if (config.service === 'AfricasTalking' && config.api_key && config.username) {
      response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': config.api_key,
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          username: config.username,
          to: destination,
          message: message,
          from: config.from_number || config.sender_id || ''
        })
      });
    }
    // Vonage (formerly Nexmo) SMS
    else if (config.service === 'Vonage' && config.api_key && config.api_secret) {
      response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: config.from_number || config.sender_id || 'TailoredHands',
          to: destination,
          text: message,
          api_key: config.api_key,
          api_secret: config.api_secret
        })
      });
    }
    // Termii (popular in Nigeria/West Africa)
    else if (config.service === 'Termii' && config.api_key) {
      response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: destination,
          from: config.sender_id || 'TailoredHands',
          sms: message,
          type: 'plain',
          api_key: config.api_key,
          channel: 'generic'
        })
      });
    }
    // Custom SMS API endpoint
    else if (config.service === 'Custom' && config.custom_api_url) {
      const requestBody = {
        to: destination,
        message: message,
        from: config.from_number || config.sender_id
      };

      // Add any custom headers or auth
      const headers = {
        'Content-Type': 'application/json'
      };

      if (config.api_key) {
        if (config.auth_type === 'bearer') {
          headers['Authorization'] = `Bearer ${config.api_key}`;
        } else if (config.auth_type === 'api-key') {
          headers['X-API-Key'] = config.api_key;
        } else {
          headers['Authorization'] = config.api_key;
        }
      }

      response = await fetch(config.custom_api_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
    }
    else {
      throw new Error('Invalid SMS service configuration');
    }

    // Parse response
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      data = { message: 'SMS sent successfully' };
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error_message || data.error || 'Failed to send SMS');
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      data: data
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export async function testSMS({ destination, message }) {
  if (!destination) throw new Error('Destination phone number is required');
  if (!message) throw new Error('Message is required');

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(destination)) {
    throw new Error('Invalid phone number format');
  }

  try {
    const config = await getSMSConfig();
    if (!config || !config.service) {
      throw new Error('Please configure SMS service first');
    }

    // Validate configuration based on service type
    if (config.service === 'Twilio' && (!config.account_sid || !config.auth_token || !config.from_number)) {
      throw new Error('Twilio Account SID, Auth Token, and From Number are required');
    }
    
    if (config.service === 'AfricasTalking' && (!config.api_key || !config.username)) {
      throw new Error('Africa\'s Talking API key and username are required');
    }
    
    if (config.service === 'Vonage' && (!config.api_key || !config.api_secret)) {
      throw new Error('Vonage API key and secret are required');
    }
    
    if (config.service === 'Termii' && !config.api_key) {
      throw new Error('Termii API key is required');
    }
    
    if (config.service === 'Custom' && (!config.custom_api_url || !config.api_key)) {
      throw new Error('Custom API URL and authentication are required');
    }

    const result = await sendSMS({ destination, message });
    return {
      success: true,
      message: result.message || 'Test SMS sent successfully',
      data: result.data
    };
  } catch (error) {
    console.error('Test SMS error:', error);
    throw new Error(error.message || 'Failed to send test SMS');
  }
}

export async function sendBulkSMS({ phones, message }) {
  if (!phones || !phones.length) {
    throw new Error('At least one phone number is required');
  }
  if (!message) {
    throw new Error('Message is required');
  }

  try {
    const destination = phones.join(',');
    const result = await sendSMS({ destination, message });
    
    return {
      success: true,
      message: `Bulk SMS sent successfully to ${phones.length} recipients`,
      data: result.data,
      rawResponse: result.rawResponse
    };
  } catch (error) {
    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
}
