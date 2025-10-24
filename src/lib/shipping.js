import { api } from './services/api';

export async function calculateShipping(country, orderAmount) {
  try {
    console.log('🚚 calculateShipping called with:', { country, orderAmount });
    
    // Fetch shipping rules from backend API
    const rules = await api.get('/shipping/active');
    
    console.log('📦 Fetched shipping rules from database:', rules?.length || 0);
    
    if (!rules?.length) {
      console.log('❌ No shipping rules found');
      return null;
    }

    // First, try to find a country-specific rule
    const countryRules = rules.filter(rule => 
      rule.country === country &&
      (!rule.min_order_value || orderAmount >= rule.min_order_value) &&
      (!rule.max_order_value || orderAmount <= rule.max_order_value)
    );

    console.log('🌍 Country-specific rules found:', countryRules);

    if (countryRules.length > 0) {
      console.log('✅ Using country-specific rule:', countryRules[0]);
      return {
        ...countryRules[0],
        shipping_cost: countryRules[0].shipping_cost
      };
    }

    // If no country-specific rule, check for international rules
    // (rules that don't have country set)
    const internationalRules = rules.filter(rule => 
      !rule.country &&
      (!rule.min_order_value || orderAmount >= rule.min_order_value) &&
      (!rule.max_order_value || orderAmount <= rule.max_order_value)
    );

    console.log('🌐 International rules found:', internationalRules);

    if (internationalRules.length > 0) {
      console.log('✅ Using international rule:', internationalRules[0]);
      return {
        ...internationalRules[0],
        shipping_cost: internationalRules[0].shipping_cost
      };
    }

    console.log('❌ No matching shipping rule found');
    return null;
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return null;
  }
}
