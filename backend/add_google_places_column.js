const { query } = require('./config/database');

async function addGooglePlacesColumn() {
  try {
    console.log('🔄 Adding Google Places API key column to settings table...');
    
    await query(`
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_places_api_key TEXT;
    `);
    
    console.log('✅ Google Places API key column added successfully');
    
    // Add comment for documentation
    await query(`
      COMMENT ON COLUMN settings.google_places_api_key IS 'Google Places API key for address autocomplete';
    `);
    
    console.log('✅ Column comment added');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Google Places API key column:', error);
    process.exit(1);
  }
}

addGooglePlacesColumn();
