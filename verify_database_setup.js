// Verify database setup and Paystack configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Check profiles table
    console.log('1️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
    } else {
      console.log(`✅ Profiles table working. Found ${profiles.length} profiles.`);
    }

    // Check settings table
    console.log('\n2️⃣ Checking settings table...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (settingsError) {
      console.error('❌ Settings table error:', settingsError.message);
    } else {
      console.log('✅ Settings table working.');
      console.log('📋 Settings found:', {
        store_name: settings?.store_name,
        paystack_public_key: settings?.paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: settings?.paystack_secret_key ? 'SET' : 'NOT SET',
        exchange_rate: settings?.exchange_rate
      });
    }

    // Check orders table
    console.log('\n3️⃣ Checking orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Orders table error:', ordersError.message);
    } else {
      console.log(`✅ Orders table working. Found ${orders.length} orders.`);
    }

    // Check products table
    console.log('\n4️⃣ Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table error:', productsError.message);
    } else {
      console.log(`✅ Products table working. Found ${products.length} products.`);
    }

    console.log('\n🎉 Database verification complete!');

  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifySetup(); 