import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseFix() {
  try {
    console.log('🔧 Starting comprehensive database schema fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_database_schema_complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📈 Database fix completed!');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 All database schema fixes applied successfully!');
    } else {
      console.log('⚠️ Some fixes may have failed. Check the logs above.');
    }
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    // Check settings table
    const { data: settingsColumns, error: settingsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'settings')
      .in('column_name', ['email', 'exchange_rate_ghs', 'company_name', 'company_address', 'company_phone', 'company_website']);
    
    if (!settingsError && settingsColumns) {
      console.log('📋 Settings table columns:', settingsColumns.map(col => col.column_name));
    }
    
    // Check consultations table
    const { data: consultationsColumns, error: consultationsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'consultations')
      .eq('column_name', 'recaptcha_token');
    
    if (!consultationsError && consultationsColumns) {
      console.log('📋 Consultations table recaptcha_token:', consultationsColumns.length > 0 ? '✅ Present' : '❌ Missing');
    }
    
    // Check messages table
    const { data: messagesColumns, error: messagesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'messages')
      .eq('column_name', 'recaptcha_token');
    
    if (!messagesError && messagesColumns) {
      console.log('📋 Messages table recaptcha_token:', messagesColumns.length > 0 ? '✅ Present' : '❌ Missing');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during database fix:', error);
    process.exit(1);
  }
}

// Run the fix
runDatabaseFix(); 