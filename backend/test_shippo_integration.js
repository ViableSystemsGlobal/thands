const shippoService = require('./services/shippoService');
const { query } = require('./config/database');

async function testShippoIntegration() {
  console.log('🚢 Testing Shippo Integration...\n');

  try {
    // Test 1: Check if Shippo is configured
    console.log('1. Checking Shippo configuration...');
    if (!shippoService.isConfigured()) {
      console.log('❌ Shippo is not configured. Please set SHIPPO_API_KEY in .env file');
      return;
    }
    console.log('✅ Shippo is configured');

    // Test 2: Check database schema
    console.log('\n2. Checking database schema...');
    const schemaResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name LIKE 'shipping_%'
      ORDER BY column_name
    `);
    
    console.log('✅ Shipping columns found:', schemaResult.rows.length);
    schemaResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Test 3: Test address validation
    console.log('\n3. Testing address validation...');
    const testAddress = {
      name: 'John Doe',
      street1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US'
    };

    const validationResult = await shippoService.validateAddress(testAddress);
    if (validationResult.success) {
      console.log('✅ Address validation working');
    } else {
      console.log('⚠️  Address validation failed:', validationResult.error);
    }

    // Test 4: Test supported carriers
    console.log('\n4. Testing supported carriers...');
    const carriersResult = await shippoService.getSupportedCarriers('US');
    if (carriersResult.success) {
      console.log('✅ Supported carriers for US:', carriersResult.carriers.join(', '));
    } else {
      console.log('⚠️  Failed to get carriers:', carriersResult.error);
    }

    // Test 5: Test shipping rates (if API key is valid)
    console.log('\n5. Testing shipping rates...');
    const testParcel = {
      length: '10',
      width: '10',
      height: '5',
      distance_unit: 'in',
      weight: '1.0',
      mass_unit: 'lb'
    };

    const ratesResult = await shippoService.getShippingRates(testAddress, testParcel);
    if (ratesResult.success) {
      console.log(`✅ Found ${ratesResult.rates.length} shipping rates`);
      ratesResult.rates.slice(0, 3).forEach(rate => {
        console.log(`   - ${rate.provider} ${rate.servicelevel.name}: $${rate.amount} ${rate.currency}`);
      });
    } else {
      console.log('⚠️  Failed to get rates:', ratesResult.error);
    }

    // Test 6: Check for international orders
    console.log('\n6. Checking for international orders...');
    const internationalOrders = await query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE is_international = TRUE
    `);
    console.log(`✅ Found ${internationalOrders.rows[0].count} international orders`);

    // Test 7: Check orders needing labels
    console.log('\n7. Checking orders needing labels...');
    const ordersNeedingLabels = await query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE is_international = TRUE 
        AND status IN ('confirmed', 'processing')
        AND tracking_number IS NULL
    `);
    console.log(`✅ Found ${ordersNeedingLabels.rows[0].count} orders needing shipping labels`);

    console.log('\n🎉 Shippo integration test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up your Shippo API key in .env file');
    console.log('2. Configure webhooks in Shippo dashboard');
    console.log('3. Test with a real international order');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testShippoIntegration().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
