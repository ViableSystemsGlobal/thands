// Test Shippo client methods
console.log('🔍 Testing Shippo client methods...');

try {
  const shippo = require('shippo');
  const client = new shippo.Shippo('test_key');
  
  console.log('✅ Shippo client created');
  console.log('🔍 Client type:', typeof client);
  console.log('🔍 Client keys:', Object.keys(client));
  console.log('🔍 Client methods:', Object.getOwnPropertyNames(client));
  
  // Check for common Shippo methods
  const methods = ['create', 'shipment', 'rate', 'address', 'parcel'];
  methods.forEach(method => {
    if (client[method]) {
      console.log(`✅ ${method} method exists:`, typeof client[method]);
    } else {
      console.log(`❌ ${method} method not found`);
    }
  });
  
} catch (error) {
  console.error('❌ Error testing Shippo methods:', error);
}

process.exit(0);
