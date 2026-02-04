const shippo = require('shippo');

class ShippoService {
  constructor() {
    this.apiKey = null;
    this.webhookSecret = null;
    this.shippo = null;
    this.settings = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          shippo_api_key,
          shippo_webhook_secret,
          shippo_from_name,
          shippo_from_street,
          shippo_from_city,
          shippo_from_state,
          shippo_from_zip,
          shippo_from_country
        FROM settings 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        this.settings = result.rows[0];
        this.apiKey = this.settings.shippo_api_key;
        this.webhookSecret = this.settings.shippo_webhook_secret;
      }

      // Fallback to environment variables if database settings are not available
      if (!this.apiKey) {
        this.apiKey = process.env.SHIPPO_API_KEY;
        this.webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET;
      }
      
      if (this.apiKey && this.apiKey !== 'your_shippo_api_key_here' && this.apiKey.trim() !== '') {
        try {
          // Initialize Shippo with the API key using the correct constructor
          this.shippo = new shippo.Shippo({
            apiKeyHeader: this.apiKey,
            shippoApiVersion: "2018-02-08"
          });
          console.log('✅ Shippo initialized successfully with API key:', this.apiKey.substring(0, 10) + '...');
        } catch (error) {
          console.warn('⚠️  Failed to initialize Shippo:', error.message);
          console.log('🔍 Error details:', error);
        }
      } else {
        console.warn('⚠️  Shippo API key not found. International shipping will be disabled.');
        console.log('🔍 API Key value:', this.apiKey);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing Shippo:', error);
      this.initialized = true;
    }
  }

  /**
   * Check if Shippo is properly configured
   */
  isConfigured() {
    return !!(this.apiKey && this.shippo);
  }

  /**
   * Get shipping rates for an address
   * @param {Object} address - Destination address
   * @param {Object} parcel - Package dimensions and weight
   * @param {Object} options - Additional options
   */
  async getShippingRates(address, parcel, options = {}) {
    try {
      await this.initialize();
      
      if (!this.isConfigured()) {
        throw new Error('Shippo is not configured');
      }

      console.log('🚢 Shippo: Getting shipping rates for:', address.country);
      console.log('🔑 Shippo API Key (first 10 chars):', this.apiKey?.substring(0, 10) + '...');
      console.log('🔑 Shippo client initialized:', !!this.shippo);
      console.log('📍 Address being sent to Shippo:', JSON.stringify(address, null, 2));
      console.log('📦 Parcel being sent to Shippo:', JSON.stringify(parcel, null, 2));

      // Use branch-specific settings if provided, otherwise fall back to service settings
      const branchSettings = options.branchSettings || {};
      const fromAddress = {
        name: branchSettings.shippo_from_name || this.settings?.shippo_from_name || process.env.SHIPPO_FROM_NAME || "TailoredHands",
        street1: branchSettings.shippo_from_street || this.settings?.shippo_from_street || process.env.SHIPPO_FROM_STREET || "123 Business Street",
        city: branchSettings.shippo_from_city || branchSettings.shipping_origin_city || this.settings?.shippo_from_city || process.env.SHIPPO_FROM_CITY || "Accra",
        state: branchSettings.shippo_from_state || this.settings?.shippo_from_state || process.env.SHIPPO_FROM_STATE || "Greater Accra",
        zip: branchSettings.shippo_from_zip || this.settings?.shippo_from_zip || process.env.SHIPPO_FROM_ZIP || "00233",
        country: branchSettings.shippo_from_country || branchSettings.shipping_origin_country || this.settings?.shippo_from_country || process.env.SHIPPO_FROM_COUNTRY || "GH"
      };

      console.log('📍 Shippo origin address (branch-specific):', JSON.stringify(fromAddress, null, 2));

      const shipment = await this.shippo.shipments.create({
        addressFrom: fromAddress,
        addressTo: {
          name: address.name,
          street1: address.street1,
          street2: address.street2 || "",
          city: address.city,
          state: address.state || "",
          zip: address.zip,
          country: address.country
        },
        parcels: [parcel],
        async: false
      });

      console.log('✅ Shippo: Found', shipment.rates?.length || 0, 'shipping rates');
      console.log('📊 Shippo response:', JSON.stringify(shipment, null, 2));

      return {
        success: true,
        rates: shipment.rates || [],
        shipment: shipment
      };
    } catch (error) {
      console.error('❌ Shippo rate error:', error);
      return {
        success: false,
        error: error.message,
        rates: []
      };
    }
  }

  /**
   * Create a shipping label
   * @param {string} rateId - The rate ID from getShippingRates
   * @param {Object} options - Additional options
   */
  async createLabel(rateId, options = {}) {
    try {
      await this.initialize();
      
      if (!this.isConfigured()) {
        throw new Error('Shippo is not configured');
      }

      console.log('🏷️  Shippo: Creating label for rate:', rateId);

      const transaction = await this.shippo.transaction.create({
        rate: rateId,
        label_file_type: options.labelFileType || "PDF",
        async: false,
        ...options
      });

      console.log('✅ Shippo: Label created successfully');

      return {
        success: true,
        transaction: transaction,
        trackingNumber: transaction.tracking_number,
        labelUrl: transaction.label_url,
        carrier: transaction.carrier,
        serviceLevel: transaction.servicelevel?.name
      };
    } catch (error) {
      console.error('❌ Shippo label error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track a shipment
   * @param {string} trackingNumber - Tracking number
   */
  async trackShipment(trackingNumber) {
    try {
      await this.initialize();
      
      if (!this.isConfigured()) {
        throw new Error('Shippo is not configured');
      }

      console.log('📦 Shippo: Tracking shipment:', trackingNumber);

      const tracking = await this.shippo.track.get_status(trackingNumber);

      return {
        success: true,
        tracking: tracking
      };
    } catch (error) {
      console.error('❌ Shippo tracking error:', error);
      return {
        success: false,
        error: error.message
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
        throw new Error('Shippo is not configured');
      }

      console.log('📍 Shippo: Validating address');

      const validation = await this.shippo.address.create(address);

      return {
        success: true,
        validation: validation,
        isValid: validation.validation_results?.is_valid || false
      };
    } catch (error) {
      console.error('❌ Shippo address validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get supported carriers for a country
   * @param {string} countryCode - Country code (e.g., 'US', 'GH', 'GB')
   */
  async getSupportedCarriers(countryCode) {
    try {
      await this.initialize();
      
      if (!this.isConfigured()) {
        throw new Error('Shippo is not configured');
      }

      // This would typically come from Shippo's carrier API
      // For now, we'll return common carriers
      const carriers = {
        'US': ['ups', 'fedex', 'usps', 'dhl_express'],
        'GH': ['dhl_express', 'fedex'],
        'GB': ['ups', 'fedex', 'dhl_express', 'royal_mail'],
        'CA': ['ups', 'fedex', 'dhl_express', 'canada_post'],
        'AU': ['ups', 'fedex', 'dhl_express', 'australia_post']
      };

      return {
        success: true,
        carriers: carriers[countryCode] || ['dhl_express', 'fedex']
      };
    } catch (error) {
      console.error('❌ Shippo carriers error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate estimated delivery time
   * @param {string} carrier - Carrier name
   * @param {string} serviceLevel - Service level
   * @param {string} fromCountry - Origin country
   * @param {string} toCountry - Destination country
   */
  getEstimatedDelivery(carrier, serviceLevel, fromCountry, toCountry) {
    // This is a simplified estimation
    // In production, you'd want to use Shippo's transit time API
    const baseDays = {
      'dhl_express': { 'express': 2, 'standard': 5 },
      'fedex': { 'express': 1, 'standard': 3 },
      'ups': { 'express': 1, 'standard': 3 },
      'usps': { 'express': 2, 'standard': 7 }
    };

    const carrierTimes = baseDays[carrier] || { 'standard': 7 };
    const serviceTime = carrierTimes[serviceLevel?.toLowerCase()] || carrierTimes['standard'];
    
    // Add extra days for international shipping
    const isInternational = fromCountry !== toCountry;
    const extraDays = isInternational ? 2 : 0;

    return serviceTime + extraDays;
  }
}

module.exports = new ShippoService();
