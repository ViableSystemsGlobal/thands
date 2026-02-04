import { api } from './services/api';

// Country name normalization and mapping
const countryMappings = {
  'GH': 'Ghana',
  'Ghana': 'Ghana',
  'ghana': 'Ghana',
  'GB': 'United Kingdom',
  'UK': 'United Kingdom',
  'United Kingdom': 'United Kingdom',
  'US': 'United States',
  'USA': 'United States',
  'United States': 'United States',
};

function normalizeCountry(country) {
  if (!country) return null;
  // Check direct mapping first
  if (countryMappings[country]) {
    return countryMappings[country];
  }
  // Return as-is if no mapping found
  return country.trim();
}

export async function calculateShipping(country, orderAmount) {
  try {
    console.log('🚚 calculateShipping called with:', { country, orderAmount });
    
    // Fetch shipping rules from backend API
    const rules = await api.get('/shipping/active');
    
    console.log('📦 Fetched shipping rules from database:', rules?.length || 0);
    console.log('📦 All shipping rules:', rules);
    
    if (!rules?.length) {
      console.log('❌ No shipping rules found');
      return null;
    }

    // Normalize the country name for matching
    const normalizedCountry = normalizeCountry(country);
    console.log('🌍 Normalized country:', { original: country, normalized: normalizedCountry });

    // First, try to find a country-specific rule (case-insensitive matching)
    const countryRules = rules.filter(rule => {
      const ruleCountry = rule.country ? rule.country.trim() : null;
      const matchesCountry = ruleCountry && (
        ruleCountry.toLowerCase() === normalizedCountry?.toLowerCase() ||
        ruleCountry.toLowerCase() === country?.toLowerCase() ||
        normalizeCountry(ruleCountry)?.toLowerCase() === normalizedCountry?.toLowerCase()
      );
      
      const matchesAmount = (!rule.min_order_value || orderAmount >= rule.min_order_value) &&
                           (!rule.max_order_value || orderAmount <= rule.max_order_value);
      
      console.log('🔍 Checking rule:', {
        ruleName: rule.name,
        ruleCountry,
        matchesCountry,
        minOrder: rule.min_order_value,
        maxOrder: rule.max_order_value,
        orderAmount,
        matchesAmount
      });
      
      return matchesCountry && matchesAmount;
    });

    console.log('🌍 Country-specific rules found:', countryRules);

    if (countryRules.length > 0) {
      console.log('✅ Using country-specific rule:', countryRules[0]);
      return {
        ...countryRules[0],
        shipping_cost: countryRules[0].shipping_cost
      };
    }

    // If no country-specific rule, check for international rules
    // (rules that don't have country set or have country as null/empty)
    const internationalRules = rules.filter(rule => {
      const hasNoCountry = !rule.country || rule.country.trim() === '' || rule.country.toLowerCase() === 'international';
      const matchesAmount = (!rule.min_order_value || orderAmount >= rule.min_order_value) &&
                           (!rule.max_order_value || orderAmount <= rule.max_order_value);
      
      return hasNoCountry && matchesAmount;
    });

    console.log('🌐 International rules found:', internationalRules);

    if (internationalRules.length > 0) {
      console.log('✅ Using international rule:', internationalRules[0]);
      return {
        ...internationalRules[0],
        shipping_cost: internationalRules[0].shipping_cost
      };
    }

    console.log('❌ No matching shipping rule found');
    console.log('🔍 Debug info:', {
      country,
      normalizedCountry,
      orderAmount,
      availableRules: rules.map(r => ({
        name: r.name,
        country: r.country,
        min_order: r.min_order_value,
        max_order: r.max_order_value
      }))
    });
    return null;
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return null;
  }
}
