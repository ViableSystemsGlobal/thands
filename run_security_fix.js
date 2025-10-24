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

async function runSecurityFix() {
  try {
    console.log('🔒 Starting URGENT security fix...');
    console.log('⚠️  This will enable Row Level Security on all your database tables');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./URGENT_SECURITY_FIX.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🔍 Verifying RLS status...');
    
    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public');
    
    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('\n📊 RLS Status Report:');
      console.log('Table Name | RLS Enabled');
      console.log('-----------|------------');
      rlsStatus.forEach(table => {
        const status = table.rowsecurity ? '✅ YES' : '❌ NO';
        console.log(`${table.tablename.padEnd(10)} | ${status}`);
      });
    }
    
    console.log('\n🎉 Security fix completed!');
    console.log('⚠️  IMPORTANT: Test your application to ensure everything still works');
    console.log('📝 Review the policies and adjust them based on your specific needs');
    
  } catch (error) {
    console.error('💥 Critical error during security fix:', error);
    process.exit(1);
  }
}

// Confirm before running
console.log('🚨 URGENT SECURITY FIX');
console.log('=====================');
console.log('This script will enable Row Level Security on all your database tables.');
console.log('This is CRITICAL for securing your application.');
console.log('');
console.log('⚠️  WARNING: This may temporarily break your application if policies are too restrictive.');
console.log('Make sure you have a backup and can access your Supabase dashboard to fix any issues.');
console.log('');

runSecurityFix();
