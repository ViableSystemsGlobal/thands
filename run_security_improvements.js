import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSecurityImprovements() {
  try {
    console.log('🔒 Starting security improvements...');
    console.log('🛡️  Fixing function search path vulnerabilities');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./SECURITY_IMPROVEMENTS.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
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
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    console.log('\n🎉 Security improvements completed!');
    console.log('\n📋 Additional Security Recommendations:');
    console.log('1. 🔐 Enable leaked password protection in Supabase Auth settings');
    console.log('2. ⏰ Reduce OTP expiry time to less than 1 hour');
    console.log('3. 🔄 Upgrade PostgreSQL version when available');
    console.log('4. 🔑 Change default admin password');
    console.log('5. 🛡️  Enable 2FA on your Supabase account');
    
  } catch (error) {
    console.error('💥 Error during security improvements:', error);
    process.exit(1);
  }
}

console.log('🛡️ SECURITY IMPROVEMENTS');
console.log('========================');
console.log('This script will fix function search path vulnerabilities.');
console.log('These are security best practices to prevent SQL injection.');
console.log('');

runSecurityImprovements();
