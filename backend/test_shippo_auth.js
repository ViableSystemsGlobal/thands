// Test Shippo authentication with different API key formats
console.log('🔍 Testing Shippo authentication...');

try {
  const shippo = require('shippo');
  
  // Test with a test API key format
  const testApiKey = 'shippo_test_1234567890abcdef';
  console.log('🔑 Testing with test API key format:', testApiKey.substring(0, 15) + '...');
  
  const client = new shippo.Shippo(testApiKey);
  console.log('✅ Test client created');
  
  // Try to make a simple API call
  client.shipments.list({ page: 1, results: 1 })
    .then(result => {
      console.log('✅ Test API call successful:', result);
    })
    .catch(error => {
      console.log('❌ Test API call failed:', error.message);
    });
  
} catch (error) {
  console.error('❌ Error testing Shippo auth:', error);
}

process.exit(0);
