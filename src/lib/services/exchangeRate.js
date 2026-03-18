// Centralized Exchange Rate Service
// This service manages the exchange rate between USD and GHS
import { API_BASE_URL } from '@/lib/services/api';

class ExchangeRateService {
  constructor() {
    this.exchangeRate = 10.0; // Default fallback rate (matches current API)
    this.subscribers = new Set();
  }

  // Set the exchange rate from admin settings
  setExchangeRate(rate) {
    const newRate = parseFloat(rate) || 10.0;
    console.log(`🔄 Exchange rate changing from ${this.exchangeRate} to ${newRate}`);
    this.exchangeRate = newRate;
    this.notifySubscribers();
  }

  // Get current exchange rate
  getExchangeRate() {
    return this.exchangeRate;
  }

  // Convert USD to GHS
  usdToGhs(usdAmount) {
    return parseFloat(usdAmount) * this.exchangeRate;
  }

  // Convert GHS to USD
  ghsToUsd(ghsAmount) {
    return parseFloat(ghsAmount) / this.exchangeRate;
  }

  // Subscribe to exchange rate changes
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of rate changes
  notifySubscribers() {
    console.log(`📢 Notifying ${this.subscribers.size} subscribers of rate change to ${this.exchangeRate}`);
    this.subscribers.forEach(callback => callback(this.exchangeRate));
  }

  // Force refresh all subscribers
  forceRefresh() {
    console.log('🔄 FORCE REFRESH: Notifying all subscribers with current rate:', this.exchangeRate);
    this.notifySubscribers();
  }

  // Format price in GHS
  formatGhsPrice(amount) {
    return `₵${this.usdToGhs(amount).toFixed(2)}`;
  }

  // Format price in USD
  formatUsdPrice(amount) {
    return `$${parseFloat(amount).toFixed(2)} USD`;
  }

  // Get both currencies formatted
  formatDualCurrency(usdAmount) {
    return {
      usd: this.formatUsdPrice(usdAmount),
      ghs: this.formatGhsPrice(usdAmount),
      usdValue: parseFloat(usdAmount),
      ghsValue: this.usdToGhs(usdAmount)
    };
  }
}

// Create singleton instance
const exchangeRateService = new ExchangeRateService();

// Initialize exchange rate from admin settings
const initializeExchangeRate = async () => {
  try {
    console.log('🔄 Loading exchange rate from API...');
    const response = await fetch(`${API_BASE_URL}/exchange-rate`);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 API response data:', data);
      console.log('📊 Exchange rate from API:', data.exchange_rate);
      
      if (data.exchange_rate) {
        console.log('🔄 Setting exchange rate to:', data.exchange_rate);
        exchangeRateService.setExchangeRate(data.exchange_rate);
        console.log('✅ Exchange rate loaded and set:', data.exchange_rate);
        console.log('✅ Current service rate:', exchangeRateService.getExchangeRate());
      } else {
        console.warn('❌ No exchange_rate in API response');
      }
    } else {
      console.warn('❌ Failed to fetch exchange rate:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('❌ Failed to load exchange rate from settings:', error);
    console.warn('❌ Error details:', error.message);
  }
};

// Load exchange rate from admin settings
export const loadExchangeRateFromSettings = async () => {
  console.log('🔄 FORCE RELOADING exchange rate from settings...');
  await initializeExchangeRate();
  console.log('✅ Exchange rate reload completed. Current rate:', exchangeRateService.getExchangeRate());
};

// Force refresh all components
export const forceRefreshExchangeRate = () => {
  exchangeRateService.forceRefresh();
};

// Global refresh function - call this after saving settings
export const refreshAllPrices = async () => {
  console.log('🔄 REFRESHING ALL PRICES...');
  
  // 1. Reload exchange rate from API
  await loadExchangeRateFromSettings();
  
  // 2. Force refresh all subscribers
  exchangeRateService.forceRefresh();
  
  // 3. Force page reload to ensure all components update
  setTimeout(() => {
    window.location.reload();
  }, 500);
  
  console.log('✅ All prices refreshed!');
};

// Initialize on module load
initializeExchangeRate();

export default exchangeRateService;
