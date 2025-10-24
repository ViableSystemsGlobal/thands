#!/usr/bin/env node

/**
 * Migration Test Script
 * 
 * This script tests the migration setup and shows you what will be migrated
 * without making any changes to your database.
 */

const { runMigration, CONFIG } = require('./migrate-from-supabase.js');

// Force dry run mode
process.argv.push('--dry-run');

console.log('🧪 Testing Supabase to PostgreSQL migration...\n');
console.log('This is a DRY RUN - no changes will be made to your database.\n');

runMigration().catch(error => {
  console.error('\n❌ Migration test failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Check your Supabase credentials in migration-config.env');
  console.log('   2. Ensure your local PostgreSQL database is running');
  console.log('   3. Verify your Supabase service role key has proper permissions');
  process.exit(1);
});
