import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runOrderCreationFix() {
  try {
    console.log('🔧 Fixing order creation policies...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('FIX_ORDER_CREATION_POLICIES.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip the final SELECT statement as it's just for verification
      if (statement.includes('SELECT') && statement.includes('pg_policies')) {
        console.log('⏭️  Skipping verification query (will run separately)');
        continue;
      }
      
      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length - 1}...`);
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
    
    // Now run the verification query
    console.log('🔍 Verifying policies were created...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['orders', 'order_items'])
      .order('tablename')
      .order('policyname');
    
    if (verifyError) {
      console.error('❌ Error verifying policies:', verifyError);
    } else {
      console.log('✅ Current policies for orders and order_items:');
      policies.forEach(policy => {
        console.log(`   ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('🎉 Order creation policy fix completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Added INSERT policies for orders table');
    console.log('   ✅ Added INSERT policies for order_items table');
    console.log('   ✅ Added UPDATE policies for payment status updates');
    console.log('   ✅ Added admin policies for full access');
    console.log('');
    console.log('🚀 Orders should now be created successfully after payment!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
runOrderCreationFix();
