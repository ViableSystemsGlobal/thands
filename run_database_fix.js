const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env file and ensure these variables are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database schema fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_database_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      return;
    }
    
    console.log('✅ Database schema fix completed successfully!');
    console.log('');
    console.log('📊 Migration results:');
    console.log(data);
    
    // Verify the changes
    console.log('');
    console.log('🔍 Verifying changes...');
    
    // Check settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (settingsError) {
      console.error('❌ Error checking settings:', settingsError);
    } else {
      console.log('✅ Settings table updated:', {
        hasEmail: !!settingsData.email,
        hasExchangeRate: !!settingsData.exchange_rate_ghs,
        email: settingsData.email,
        exchangeRate: settingsData.exchange_rate_ghs
      });
    }
    
    // Check consultations table structure
    const { data: consultationsData, error: consultationsError } = await supabase
      .from('consultations')
      .select('recaptcha_token')
      .limit(1);
    
    if (consultationsError && consultationsError.code === 'PGRST204') {
      console.error('❌ Consultations table still missing recaptcha_token column');
    } else {
      console.log('✅ Consultations table has recaptcha_token column');
    }
    
    // Check messages table structure
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('recaptcha_token')
      .limit(1);
    
    if (messagesError && messagesError.code === 'PGRST204') {
      console.error('❌ Messages table still missing recaptcha_token column');
    } else {
      console.log('✅ Messages table has recaptcha_token column');
    }
    
    console.log('');
    console.log('🎉 Database schema fix verification complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the Contact Us form');
    console.log('3. Test the Consultation form');
    console.log('4. Check that exchange rates are working');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
runMigration(); 