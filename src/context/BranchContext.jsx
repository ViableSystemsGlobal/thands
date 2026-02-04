import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/services/api";

// Get currency context from window (set by CurrencyProvider)
const getCurrencyContext = () => {
  if (typeof window !== 'undefined' && window.__currencyContext) {
    return window.__currencyContext;
  }
  return null;
};

const BranchContext = createContext(null);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};

export const BranchProvider = ({ children }) => {
  // Check if user has manually selected a branch (not auto-detected)
  const [hasUserSelected, setHasUserSelected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("branch_user_selected") === "true";
    }
    return false;
  });
  
  const [branchCode, setBranchCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("branch_code") || "GH";
    }
    return "GH";
  });
  
  const [branchSettings, setBranchSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [geoDetectionDone, setGeoDetectionDone] = useState(false);

  // Fetch branch settings from API
  const fetchBranchSettings = useCallback(async (code) => {
    try {
      setLoading(true);
      const response = await api.get(`/branches/${code}`);
      if (response.success && response.branch) {
        setBranchSettings(response.branch);
        return response.branch;
      }
    } catch (error) {
      console.error('Error fetching branch settings:', error);
      // Fallback to default branch
      if (code !== 'GH') {
        return fetchBranchSettings('GH');
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Fetch all available branches
  const fetchAvailableBranches = useCallback(async () => {
    try {
      const response = await api.get('/branches');
      if (response.success && response.branches) {
        setAvailableBranches(response.branches);
        return response.branches;
      }
    } catch (error) {
      console.error('Error fetching available branches:', error);
    }
    return [];
  }, []);

  // Helper function to fetch with timeout
  const fetchWithTimeout = useCallback((url, options = {}, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }, []);

  // Set branch (with persistence)
  // isUserAction: true when user manually selects a branch, false for auto-detection
  const setBranch = useCallback(async (code, isUserAction = true) => {
    if (!code) return;
    
    const upperCode = code.toUpperCase();
    const branch = await fetchBranchSettings(upperCode);
    
    if (branch) {
      setBranchCode(upperCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem("branch_code", upperCode);
        // Track if user manually selected (to prevent overriding with geo-detection)
        if (isUserAction) {
          localStorage.setItem("branch_user_selected", "true");
          setHasUserSelected(true);
          // Clear international flag when user manually selects a specific branch
          localStorage.removeItem('branch_is_international');
        }
        // Store in a way that API client can access
        window.__branchCode = upperCode;
      }
      
      // Auto-update currency to match branch's default currency
      const currencyContext = getCurrencyContext();
      if (branch.default_currency && currencyContext) {
        const defaultCurrency = branch.default_currency;
        console.log(`🔄 Auto-updating currency to ${defaultCurrency} for branch ${upperCode}`);
        currencyContext.setCurrency(defaultCurrency);
      }
    }
  }, [fetchBranchSettings]);

  // Detect branch from IP geolocation on first visit
  const detectBranchFromIP = useCallback(async () => {
    try {
      // Check if user has MANUALLY selected a branch (don't override manual selection)
      const userSelected = localStorage.getItem('branch_user_selected') === 'true';
      if (userSelected) {
        console.log('🌍 User has manually selected a branch, skipping auto-detection');
        return localStorage.getItem('branch_code') || 'GH';
      }

      console.log('🌍 Attempting IP geolocation for auto-detection...');
      
      // Try multiple geolocation APIs as fallback
      let countryCode = null;
      let detectionSource = null;
      
      // Try ipapi.co first (most reliable)
      try {
        const response = await fetchWithTimeout('https://ipapi.co/json/', {
          headers: {
            'Accept': 'application/json'
          }
        }, 5000);
        
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
          countryCode = data.country_code;
            detectionSource = 'ipapi.co';
            console.log('🌍 Detected country from ipapi.co:', countryCode, {
              country: data.country_name,
              city: data.city,
              region: data.region
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ ipapi.co failed:', err.message);
      }
        
      // Fallback to ip-api.com (HTTPS)
      if (!countryCode) {
        try {
          const fallbackResponse = await fetchWithTimeout('https://ip-api.com/json/?fields=status,countryCode,country,city', {
            headers: {
              'Accept': 'application/json'
            }
          }, 5000);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.status === 'success' && fallbackData.countryCode) {
            countryCode = fallbackData.countryCode;
              detectionSource = 'ip-api.com';
              console.log('🌍 Detected country from ip-api.com:', countryCode, {
                country: fallbackData.country,
                city: fallbackData.city
              });
            }
          }
        } catch (fallbackErr) {
          console.warn('⚠️ ip-api.com also failed:', fallbackErr.message);
        }
      }
      
      // Final fallback: ipgeolocation.io (free tier)
      if (!countryCode) {
        try {
          const finalResponse = await fetchWithTimeout('https://api.ipgeolocation.io/ipgeo?apiKey=free', {
            headers: {
              'Accept': 'application/json'
            }
          }, 5000);
          
          if (finalResponse.ok) {
            const finalData = await finalResponse.json();
            if (finalData.country_code2) {
              countryCode = finalData.country_code2;
              detectionSource = 'ipgeolocation.io';
              console.log('🌍 Detected country from ipgeolocation.io:', countryCode, {
                country: finalData.country_name
              });
            }
          }
        } catch (finalErr) {
          console.warn('⚠️ ipgeolocation.io also failed:', finalErr.message);
        }
      }
      
      if (!countryCode) {
        console.warn('⚠️ Could not detect country from any geolocation service');
        return 'GH'; // Fallback to default
      }
      
      // Map country codes to branch codes (handle both ISO codes and variations)
      const countryToBranch = {
        'GH': 'GH',  // Ghana
        'GB': 'UK',  // United Kingdom (ISO 3166-1 alpha-2)
        'UK': 'UK',  // United Kingdom (alternative)
        'US': 'US',  // United States
        'USA': 'US'  // United States (alternative)
      };
      
      // Normalize country code (uppercase, trim)
      const normalizedCode = countryCode?.toUpperCase().trim();
      const detectedBranch = countryToBranch[normalizedCode];
      
      // If country is not in the three (GH, UK, US), treat as international
      if (!detectedBranch) {
        console.log(`🌍 International country detected: ${normalizedCode} - using USD currency`);
        // Use US branch settings (which uses USD) for international countries
        // Currency will be explicitly set to USD below
        return { branch: 'US', isInternational: true, countryCode: normalizedCode };
      }
      
      console.log(`📍 Auto-selecting branch: ${detectedBranch} for country: ${normalizedCode} (detected via ${detectionSource})`);
      
      return detectedBranch;
    } catch (error) {
      console.warn('⚠️ IP geolocation failed, using default branch:', error);
      return 'GH'; // Fallback to default
    }
  }, [fetchWithTimeout]);

  // Initialize on mount
  useEffect(() => {
    // Set window variable for API client
    if (typeof window !== 'undefined') {
      window.__branchCode = branchCode;
    }
    
    // Fetch available branches
    fetchAvailableBranches();
    
    // Check if user has manually selected a branch
    const userSelected = localStorage.getItem('branch_user_selected') === 'true';
    
    if (!userSelected && !geoDetectionDone) {
      // No manual selection - try to detect from IP
      console.log('🌍 No manual branch selection, attempting geo-detection...');
      setGeoDetectionDone(true); // Prevent multiple detection attempts
      
      detectBranchFromIP().then(async (detectionResult) => {
        if (!detectionResult) return;
        
        // Handle international countries (object with branch and isInternational)
        let detectedBranch;
        let isInternational = false;
        
        if (typeof detectionResult === 'object' && detectionResult.isInternational) {
          detectedBranch = detectionResult.branch;
          isInternational = true;
        } else {
          detectedBranch = detectionResult;
        }
        
        if (detectedBranch && detectedBranch !== branchCode) {
          console.log(`🔄 Auto-selecting branch ${detectedBranch} based on IP geolocation`);
          await setBranch(detectedBranch, false); // false = not user action
          
          // For international countries, explicitly set currency to USD and set flag
          if (isInternational) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('branch_is_international', 'true');
            }
            const currencyContext = getCurrencyContext();
            if (currencyContext) {
              console.log(`💵 Setting currency to USD for international country: ${detectionResult.countryCode}`);
              currencyContext.setCurrency('USD');
            }
          }
        } else if (detectedBranch) {
          // Load branch settings even if branch matches
          fetchBranchSettings(detectedBranch);
          
          // For international countries, explicitly set currency to USD and set flag
          if (isInternational) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('branch_is_international', 'true');
            }
            const currencyContext = getCurrencyContext();
            if (currencyContext) {
              console.log(`💵 Setting currency to USD for international country: ${detectionResult.countryCode}`);
              currencyContext.setCurrency('USD');
            }
          }
        }
      });
    } else {
      // User has manually selected OR geo-detection already done
      // Load current branch settings
      fetchBranchSettings(branchCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update branch settings when branch code changes
  useEffect(() => {
    if (branchCode) {
      fetchBranchSettings(branchCode).then((branch) => {
        // Auto-update currency when branch settings are loaded
        const currencyContext = getCurrencyContext();
        if (branch?.default_currency && currencyContext) {
          const defaultCurrency = branch.default_currency;
          const currentCurrency = currencyContext.currency;
          // Only update if currency doesn't match branch default
          if (currentCurrency !== defaultCurrency) {
            console.log(`🔄 Auto-updating currency from ${currentCurrency} to ${defaultCurrency} for branch ${branchCode}`);
            currencyContext.setCurrency(defaultCurrency);
          }
        }
      });
    }
  }, [branchCode, fetchBranchSettings]);

  // Get shipping origin from branch settings
  const getShippingOrigin = useCallback(() => {
    if (!branchSettings) return null;
    
    return {
      name: branchSettings.shippo_from_name || branchSettings.shipping_origin_name || 'TailoredHands',
      street1: branchSettings.shippo_from_street || branchSettings.shipping_origin_street || '',
      city: branchSettings.shippo_from_city || branchSettings.shipping_origin_city || '',
      state: branchSettings.shippo_from_state || branchSettings.shipping_origin_state || '',
      zip: branchSettings.shippo_from_zip || branchSettings.shipping_origin_zip || '',
      country: branchSettings.shippo_from_country || branchSettings.shipping_origin_country || 'GH'
    };
  }, [branchSettings]);

  // Get default currency from branch
  const getDefaultCurrency = useCallback(() => {
    return branchSettings?.default_currency || 'USD';
  }, [branchSettings]);

  // Force re-detection by clearing cached selection
  const forceRedetection = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('branch_user_selected');
      localStorage.removeItem('branch_code');
      setHasUserSelected(false);
      setGeoDetectionDone(false);
      console.log('🔄 Cleared cached branch selection, forcing re-detection...');
      
      // Trigger re-detection
      const detectionResult = await detectBranchFromIP();
      if (!detectionResult) return;
      
      // Handle international countries (object with branch and isInternational)
      let detectedBranch;
      let isInternational = false;
      
      if (typeof detectionResult === 'object' && detectionResult.isInternational) {
        detectedBranch = detectionResult.branch;
        isInternational = true;
      } else {
        detectedBranch = detectionResult;
      }
      
      if (detectedBranch) {
        await setBranch(detectedBranch, false);
        
        // For international countries, explicitly set currency to USD and set flag
        if (isInternational) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('branch_is_international', 'true');
          }
          const currencyContext = getCurrencyContext();
          if (currencyContext) {
            console.log(`💵 Setting currency to USD for international country: ${detectionResult.countryCode}`);
            currencyContext.setCurrency('USD');
          }
        }
      }
    }
  }, [detectBranchFromIP, setBranch]);

  const value = {
    branchCode,
    branchSettings,
    availableBranches,
    loading,
    setBranch,
    getShippingOrigin,
    getDefaultCurrency,
    refreshBranchSettings: () => fetchBranchSettings(branchCode),
    forceRedetection
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

