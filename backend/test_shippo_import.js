// Test Shippo import to see what it exports
console.log('🔍 Testing Shippo import...');

try {
  const shippo = require('shippo');
  console.log('✅ Shippo imported successfully');
  console.log('🔍 Type of shippo:', typeof shippo);
  console.log('🔍 Shippo object:', shippo);
  console.log('🔍 Shippo keys:', Object.keys(shippo));
  
  // Test if it's a function
  if (typeof shippo === 'function') {
    console.log('✅ Shippo is a function');
    try {
      const client = shippo('test_key');
      console.log('✅ Shippo client created:', typeof client);
    } catch (error) {
      console.log('❌ Error creating Shippo client:', error.message);
    }
  } else {
    console.log('❌ Shippo is not a function, it is:', typeof shippo);
  }
  
} catch (error) {
  console.error('❌ Error importing Shippo:', error);
}

process.exit(0);
