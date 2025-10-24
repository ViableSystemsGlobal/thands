import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/services/api";
import exchangeRateService, { loadExchangeRateFromSettings } from "@/lib/services/exchangeRate";

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("currency") || "USD";
    }
    return "USD";
  });
  const [exchangeRate, setExchangeRate] = useState(() => {
    // Get the current rate from the service immediately
    const currentRate = exchangeRateService.getExchangeRate();
    console.log("🔄 CurrencyContext initializing with rate:", currentRate);
    return currentRate;
  }); 
  const [loadingRate, setLoadingRate] = useState(true);

  const fetchExchangeRate = useCallback(async () => {
    setLoadingRate(true);
    try {
      console.log("🔄 CurrencyContext: Loading exchange rate...");
      // Use the centralized exchange rate service
      await exchangeRateService.loadExchangeRateFromSettings();
      const currentRate = exchangeRateService.getExchangeRate();
      setExchangeRate(currentRate);
      console.log("✅ CurrencyContext: Exchange rate loaded from centralized service:", currentRate);
    } catch (error) {
      console.error("❌ CurrencyContext: Failed to fetch exchange rate:", error);
      console.warn("Using default exchange rate of 16.0");
      setExchangeRate(16.0);
    } finally {
      setLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRate();
    
    // Subscribe to exchange rate changes from the centralized service
    const unsubscribe = exchangeRateService.subscribe((newRate) => {
      console.log("🔄 CurrencyContext: Received rate update notification:", newRate);
      console.log("🔄 CurrencyContext: Current state rate:", exchangeRate);
      console.log("🔄 CurrencyContext: Setting new rate:", newRate);
      setExchangeRate(newRate);
      console.log("✅ CurrencyContext: Exchange rate updated to:", newRate);
    });
    
    // Also get the current rate from the service in case it was already loaded
    const currentServiceRate = exchangeRateService.getExchangeRate();
    console.log("🔄 CurrencyContext: Current service rate on subscribe:", currentServiceRate);
    if (currentServiceRate !== exchangeRate) {
      console.log("🔄 CurrencyContext: Syncing with service rate:", currentServiceRate);
      setExchangeRate(currentServiceRate);
    }
    
    return unsubscribe;
  }, [fetchExchangeRate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("currency", currency);
    }
  }, [currency]);

  const formatPrice = (amountToFormat, useCode = false, displayTargetCurrency = currency, amountAlreadyInTargetCurrency = false) => {
    let amount = amountToFormat;
    let targetCurrency = displayTargetCurrency;

    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }
    
    let finalAmount = amount;

    if (targetCurrency === "GHS" && !amountAlreadyInTargetCurrency) {
      // Use Math.round to avoid floating point precision issues
      finalAmount = Math.round(amount * exchangeRate * 100) / 100;
    }

    const symbol = targetCurrency === "GHS" ? "₵" : "$";
    
    // Format with thousand separators
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(finalAmount);

    if (useCode) {
      return `${formattedAmount} ${targetCurrency}`;
    }
    
    return `${symbol}${formattedAmount}`;
  };
  
  const convertToActiveCurrency = useCallback((priceInUSD) => {
    if (typeof priceInUSD !== 'number' || isNaN(priceInUSD)) {
      priceInUSD = 0;
    }
    
    console.log(`💰 CurrencyContext.convertToActiveCurrency: USD ${priceInUSD}, currency: ${currency}, exchangeRate: ${exchangeRate}`);
    
    if (currency === "GHS") {
      // Use Math.round to avoid floating point precision issues
      const result = Math.round(priceInUSD * exchangeRate * 100) / 100;
      console.log(`💰 Conversion result: ${priceInUSD} USD * ${exchangeRate} = ${result} GHS`);
      return result;
    }
    
    console.log(`💰 Keeping USD: ${priceInUSD}`);
    return priceInUSD;
  }, [currency, exchangeRate]);

  const convertToGHS = useCallback((priceInUSD) => {
    if (typeof priceInUSD !== 'number' || isNaN(priceInUSD)) {
      priceInUSD = 0;
    }
    return priceInUSD * exchangeRate;
  }, [exchangeRate]);

  const getPaymentAmountAndCurrency = useCallback((priceInUSD) => {
    if (typeof priceInUSD !== 'number' || isNaN(priceInUSD)) {
      priceInUSD = 0;
    }
    return {
      amount: priceInUSD * exchangeRate, 
      currency: "GHS",
    };
  }, [exchangeRate]);

  const value = {
    currency,
    setCurrency,
    exchangeRate,
    fetchExchangeRate,
    formatPrice,
    convertToActiveCurrency, 
    convertToGHS,
    getPaymentAmountAndCurrency,
    loadingRate,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
