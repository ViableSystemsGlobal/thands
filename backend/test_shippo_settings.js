const { query } = require('./config/database');

async function testShippoSettings() {
  try {
    console.log('🔍 Checking Shippo settings in database...');
    
    const result = await query(`
      SELECT shippo_api_key, shippo_webhook_secret, shippo_from_name, shippo_from_street, 
             shippo_from_city, shippo_from_state, shippo_from_zip, shippo_from_country
      FROM settings 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      console.log('📊 Database settings found:');
      console.log('🔑 API Key:', settings.shippo_api_key ? settings.shippo_api_key.substring(0, 10) + '...' : 'NOT SET');
      console.log('🔐 Webhook Secret:', settings.shippo_webhook_secret ? 'SET' : 'NOT SET');
      console.log('🏢 From Name:', settings.shippo_from_name || 'NOT SET');
      console.log('📍 From Street:', settings.shippo_from_street || 'NOT SET');
      console.log('🏙️ From City:', settings.shippo_from_city || 'NOT SET');
      console.log('🗺️ From State:', settings.shippo_from_state || 'NOT SET');
      console.log('📮 From ZIP:', settings.shippo_from_zip || 'NOT SET');
      console.log('🌍 From Country:', settings.shippo_from_country || 'NOT SET');
    } else {
      console.log('❌ No settings found in database');
    }
    
    // Test Shippo service initialization
    console.log('\n🚢 Testing Shippo service initialization...');
    const shippoService = require('./services/shippoService');
    await shippoService.initialize();
    console.log('✅ Shippo service initialized');
    console.log('🔍 Is configured:', shippoService.isConfigured());
    
  } catch (error) {
    console.error('❌ Error testing Shippo settings:', error);
  } finally {
    process.exit(0);
  }
}

testShippoSettings();
