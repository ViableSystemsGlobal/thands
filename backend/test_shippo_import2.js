// Test Shippo import to see the Shippo property
console.log('🔍 Testing Shippo.Shippo property...');

try {
  const shippo = require('shippo');
  console.log('✅ Shippo imported successfully');
  console.log('🔍 Type of shippo.Shippo:', typeof shippo.Shippo);
  
  if (typeof shippo.Shippo === 'function') {
    console.log('✅ shippo.Shippo is a function');
    try {
      const client = new shippo.Shippo('test_key');
      console.log('✅ Shippo client created with new:', typeof client);
    } catch (error) {
      console.log('❌ Error creating Shippo client with new:', error.message);
    }
  } else {
    console.log('❌ shippo.Shippo is not a function, it is:', typeof shippo.Shippo);
    console.log('🔍 shippo.Shippo:', shippo.Shippo);
  }
  
} catch (error) {
  console.error('❌ Error importing Shippo:', error);
}

process.exit(0);
