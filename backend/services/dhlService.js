/**
 * MyDHL Express API Service
 * Replaces Shippo for shipping rates, labels, and tracking
 */

class DHLService {
  constructor() {
    this.apiKey = null;
    this.apiSecret = null;
    this.accountNumber = null;
    this.baseUrl = null;
    this.settings = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          dhl_api_key,
          dhl_api_secret,
          dhl_account_number,
          dhl_base_url,
          dhl_from_name,
          dhl_from_street,
          dhl_from_city,
          dhl_from_state,
          dhl_from_zip,
          dhl_from_country
        FROM settings 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        this.settings = result.rows[0];
        this.apiKey = this.settings.dhl_api_key;
        this.apiSecret = this.settings.dhl_api_secret;
        this.accountNumber = this.settings.dhl_account_number;
        this.baseUrl = this.settings.dhl_base_url;
      }

      // Fallback to environment variables
      if (!this.apiKey) {
        this.apiKey = process.env.MYDHL_USERNAME;
        this.apiSecret = process.env.MYDHL_PASSWORD;
        this.accountNumber = process.env.MYDHL_ACCOUNT_NUMBER;
        this.baseUrl = process.env.MYDHL_BASE_URL;
      }

      // Default base URL (test environment)
      if (!this.baseUrl) {
        this.baseUrl = 'https://express.api.dhl.com/mydhlapi/test';
      }

      if (this.apiKey && this.apiSecret && this.accountNumber) {
        console.log('✅ DHL service initialized with API key:', this.apiKey.substring(0, 8) + '...');
      } else {
        const missing = [];
        if (!this.apiKey) missing.push('API Key');
        if (!this.apiSecret) missing.push('API Secret');
        if (!this.accountNumber) missing.push('Account Number');
        console.warn('⚠️  DHL not fully configured. Missing:', missing.join(', '));
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing DHL service:', error);
      this.initialized = true;
    }
  }

  /**
   * Check if DHL is properly configured
   */
  isConfigured() {
    return !!(this.apiKey && this.apiSecret && this.accountNumber);
  }

  /**
   * Get Basic auth header
   */
  getAuthHeader() {
    return 'Basic ' + Buffer.from(this.apiKey + ':' + this.apiSecret).toString('base64');
  }

  /**
   * Make API request to DHL
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = this.baseUrl.replace(/\/$/, '') + endpoint;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || data.detail || data.error || response.statusText;
      throw new Error(`DHL API error (${response.status}): ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
    }

    return data;
  }

  /**
   * Get shipping rates for an address
   * @param {Object} address - Destination address
   * @param {Object} parcel - Package dimensions and weight
   * @param {Object} options - Additional options (branchSettings, etc.)
   */
  async getShippingRates(address, parcel, options = {}) {
    try {
      await this.initialize();

      if (!this.isConfigured()) {
        throw new Error('DHL is not configured');
      }

      console.log('📦 DHL: Getting shipping rates for:', address.country);

      // Use branch-specific settings if provided
      const branchSettings = options.branchSettings || {};
      const fromName = branchSettings.dhl_from_name || this.settings?.dhl_from_name || 'TailoredHands';
      const fromStreet = branchSettings.dhl_from_street || this.settings?.dhl_from_street || '123 Business Street';
      const fromCity = branchSettings.dhl_from_city || this.settings?.dhl_from_city || 'Accra';
      const fromState = branchSettings.dhl_from_state || this.settings?.dhl_from_state || 'Greater Accra';
      const fromZip = branchSettings.dhl_from_zip || this.settings?.dhl_from_zip || '00233';
      const fromCountry = branchSettings.dhl_from_country || this.settings?.dhl_from_country || 'GH';

      // Determine if domestic or international
      const isDomestic = fromCountry === address.country;
      // Product codes: N = Domestic, D = Document (international), P = Package (international)
      const productCode = isDomestic ? 'N' : 'P';
      const isCustomsDeclarable = !isDomestic;

      // Calculate planned shipping date (tomorrow)
      const plannedDate = new Date();
      plannedDate.setDate(plannedDate.getDate() + 1);
      const plannedShippingDateAndTime = plannedDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

      // Convert parcel weight from lbs to kg if needed (DHL uses metric)
      let weightKg = parcel.weight || 1;
      if (parcel.mass_unit === 'lb') {
        weightKg = weightKg * 0.453592;
      }

      // Convert dimensions from inches to cm if needed
      let lengthCm = parcel.length || 15;
      let widthCm = parcel.width || 10;
      let heightCm = parcel.height || 10;
      if (parcel.distance_unit === 'in') {
        lengthCm = lengthCm * 2.54;
        widthCm = widthCm * 2.54;
        heightCm = heightCm * 2.54;
      }

      const requestBody = {
        plannedShippingDateAndTime,
        productCode,
        unitOfMeasurement: 'metric',
        isCustomsDeclarable,
        nextBusinessDay: true,
        accounts: [
          { number: this.accountNumber, typeCode: 'shipper' }
        ],
        customerDetails: {
          shipperDetails: {
            addressLine1: fromStreet.substring(0, 45) || 'Origin Address',
            addressLine2: fromName.substring(0, 45) || 'TailoredHands',
            addressLine3: fromState.substring(0, 45) || 'Region',
            postalCode: fromZip || '00233',
            cityName: fromCity || 'Accra',
            countyName: fromState || 'Greater Accra',
            countryCode: fromCountry || 'GH',
          },
          receiverDetails: {
            addressLine1: (address.street1 || 'Destination Address').substring(0, 45),
            addressLine2: (address.street2 || address.name || 'Customer').substring(0, 45),
            addressLine3: (address.state || 'Region').substring(0, 45),
            postalCode: address.zip || address.postalCode || '00000',
            cityName: address.city || 'City',
            countyName: address.state || 'State',
            countryCode: address.country || 'GH',
          },
        },
        packages: [
          {
            weight: Math.max(0.1, weightKg),
            dimensions: {
              length: Math.max(1, Math.round(lengthCm)),
              width: Math.max(1, Math.round(widthCm)),
              height: Math.max(1, Math.round(heightCm)),
            },
          },
        ],
      };

      console.log('📤 DHL request body:', JSON.stringify(requestBody, null, 2));

      const data = await this.makeRequest('/rates', 'POST', requestBody);

      console.log('✅ DHL: Received response with', data.products?.length || 0, 'products');

      // Transform DHL response to match expected format
      const rates = (data.products || []).map(product => ({
        id: `dhl_${product.productCode}_${Date.now()}`,
        provider: 'DHL Express',
        carrier: 'DHL',
        servicelevel: { name: product.productName || product.productCode },
        amount: product.totalPrice?.[0]?.price || 0,
        currency: product.totalPrice?.[0]?.priceCurrency || 'USD',
        estimated_days: product.deliveryCapabilities?.estimatedDeliveryDateAndTime 
          ? this.calculateDaysFromDate(product.deliveryCapabilities.estimatedDeliveryDateAndTime)
          : 3,
        productCode: product.productCode,
        raw: product,
      }));

      return {
        success: true,
        rates,
        raw: data,
      };
    } catch (error) {
      console.error('❌ DHL rate error:', error);
      return {
        success: false,
        error: error.message,
        rates: [],
      };
    }
  }

  /**
   * Create a shipment (and get label)
   * @param {Object} shipmentData - Full shipment details
   */
  async createShipment(shipmentData) {
    try {
      await this.initialize();

      if (!this.isConfigured()) {
        throw new Error('DHL is not configured');
      }

      console.log('📦 DHL: Creating shipment');

      // Build shipment request based on DHL API format
      const data = await this.makeRequest('/shipments', 'POST', shipmentData);

      console.log('✅ DHL: Shipment created');

      return {
        success: true,
        shipmentId: data.shipmentTrackingNumber,
        trackingNumber: data.shipmentTrackingNumber,
        labelUrl: data.documents?.[0]?.url || null,
        packages: data.packages || [],
        raw: data,
      };
    } catch (error) {
      console.error('❌ DHL shipment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Track a shipment
   * @param {string} trackingNumber - DHL tracking number
   */
  async trackShipment(trackingNumber) {
    try {
      await this.initialize();

      if (!this.isConfigured()) {
        throw new Error('DHL is not configured');
      }

      console.log('📦 DHL: Tracking shipment:', trackingNumber);

      const data = await this.makeRequest(
        `/shipments/${trackingNumber}/tracking?trackingView=all-checkpoints&levelOfDetail=all`,
        'GET'
      );

      return {
        success: true,
        tracking: data,
        status: data.shipments?.[0]?.status?.description || 'Unknown',
        events: data.shipments?.[0]?.events || [],
      };
    } catch (error) {
      console.error('❌ DHL tracking error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate an address
   * @param {Object} address - Address to validate
   */
  async validateAddress(address) {
    try {
      await this.initialize();

      if (!this.isConfigured()) {
        throw new Error('DHL is not configured');
      }

      console.log('📍 DHL: Validating address');

      const params = new URLSearchParams({
        type: 'delivery',
        countryCode: address.country || address.countryCode,
        postalCode: address.zip || address.postalCode || '',
        cityName: address.city || address.cityName || '',
        strictValidation: 'false',
      });

      const data = await this.makeRequest(`/address-validate?${params.toString()}`, 'GET');

      return {
        success: true,
        validation: data,
        isValid: data.address?.length > 0,
      };
    } catch (error) {
      console.error('❌ DHL address validation error:', error);
      return {
        success: false,
        error: error.message,
        isValid: false,
      };
    }
  }

  /**
   * Calculate days from delivery date
   */
  calculateDaysFromDate(dateString) {
    if (!dateString) return 3;
    try {
      const deliveryDate = new Date(dateString);
      const now = new Date();
      const diffTime = deliveryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 3;
    }
  }

  /**
   * Get estimated delivery time (fallback when API doesn't provide it)
   */
  getEstimatedDelivery(carrier, serviceLevel, fromCountry, toCountry) {
    const isInternational = fromCountry !== toCountry;
    
    const baseDays = {
      'EXPRESS_WORLDWIDE': 2,
      'EXPRESS_12:00': 1,
      'EXPRESS_9:00': 1,
      'ECONOMY_SELECT': 5,
      'N': 2, // Domestic
      'P': 3, // Package
      'D': 2, // Document
    };

    const serviceDays = baseDays[serviceLevel] || 3;
    return isInternational ? serviceDays + 1 : serviceDays;
  }
}

module.exports = new DHLService();
