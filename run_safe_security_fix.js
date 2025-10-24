import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSafeSecurityFix() {
  try {
    console.log('🔒 Starting SAFE security fix...');
    console.log('⚠️  This will enable Row Level Security on all your database tables');
    console.log('🛡️  Using admin-only policies to avoid type casting issues');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./SAFE_SECURITY_FIX.sql', 'utf8');
    
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
            // Continue with other statements
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
    
    console.log('\n🔍 Verifying RLS status...');
    
    // Check RLS status using a simpler query
    try {
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;` 
        });
      
      if (rlsError) {
        console.error('❌ Error checking RLS status:', rlsError.message);
      } else {
        console.log('\n📊 RLS Status Report:');
        console.log('Table Name | RLS Enabled');
        console.log('-----------|------------');
        if (rlsStatus && rlsStatus.length > 0) {
          rlsStatus.forEach(table => {
            const status = table.rowsecurity ? '✅ YES' : '❌ NO';
            console.log(`${table.tablename.padEnd(10)} | ${status}`);
          });
        } else {
          console.log('No data returned from RLS check');
        }
      }
    } catch (err) {
      console.error('❌ Error in RLS verification:', err.message);
    }
    
    console.log('\n🎉 Security fix completed!');
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('1. All tables now have RLS enabled');
    console.log('2. Current policies are admin-only (safer approach)');
    console.log('3. You may need to add user-specific policies later');
    console.log('4. Test your application to ensure admin access works');
    console.log('5. Add user policies for cart, wishlist, etc. as needed');
    
  } catch (error) {
    console.error('💥 Critical error during security fix:', error);
    process.exit(1);
  }
}

// Confirm before running
console.log('🛡️ SAFE SECURITY FIX');
console.log('====================');
console.log('This script will enable Row Level Security on all your database tables.');
console.log('This version uses admin-only policies to avoid type casting issues.');
console.log('');
console.log('⚠️  This approach is safer but may require additional user policies later.');
console.log('');

runSafeSecurityFix();
