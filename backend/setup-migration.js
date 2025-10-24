#!/usr/bin/env node

/**
 * Migration Setup Script
 * 
 * This script helps you set up the migration from Supabase to PostgreSQL
 * by copying your existing environment variables.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Supabase to PostgreSQL migration...\n');

// Try to read existing .env file
const envPath = path.join(__dirname, '../.env');
const migrationConfigPath = path.join(__dirname, 'migration-config.env');

try {
  if (fs.existsSync(envPath)) {
    console.log('📋 Found existing .env file, copying Supabase credentials...');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let supabaseUrl = '';
    let supabaseAnonKey = '';
    
    // Extract Supabase credentials
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1];
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1];
      }
    }
    
    if (supabaseUrl && supabaseAnonKey) {
      // Update migration config
      let migrationConfig = fs.readFileSync(migrationConfigPath, 'utf8');
      
      migrationConfig = migrationConfig.replace(
        'VITE_SUPABASE_URL=https://your-project-id.supabase.co',
        `VITE_SUPABASE_URL=${supabaseUrl}`
      );
      
      // Note: We need the service key, not the anon key
      console.log('⚠️  IMPORTANT: You need your Supabase SERVICE ROLE KEY for migration');
      console.log('   The anon key doesn\'t have permission to read all data.');
      console.log('   Please get your service role key from Supabase project settings.');
      
      fs.writeFileSync(migrationConfigPath, migrationConfig);
      
      console.log('✅ Migration config updated with your Supabase URL');
      console.log('📝 Next steps:');
      console.log('   1. Get your Supabase service role key from project settings');
      console.log('   2. Edit backend/migration-config.env and add the service key');
      console.log('   3. Run: node migrate-from-supabase.js --dry-run');
      
    } else {
      console.log('❌ Could not find Supabase credentials in .env file');
      console.log('   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    }
    
  } else {
    console.log('❌ No .env file found');
    console.log('   Please create a .env file with your Supabase credentials');
  }
  
} catch (error) {
  console.error('❌ Error setting up migration:', error.message);
}

console.log('\n📚 Migration Guide:');
console.log('   1. Get Supabase service role key from: Project Settings > API');
console.log('   2. Edit backend/migration-config.env with your service key');
console.log('   3. Test migration: node migrate-from-supabase.js --dry-run');
console.log('   4. Run migration: node migrate-from-supabase.js');
console.log('   5. Verify results and update your shop to use new API');
