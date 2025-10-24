#!/usr/bin/env node

/**
 * Test Orders and Customers Migration
 * This script runs the migration in dry-run mode to verify everything works
 */

require('dotenv').config({ path: './migration-config.env' });

// Set dry run mode
process.env.DRY_RUN = 'true';
process.env.VERYBOSE = 'true';

console.log('🧪 Testing Orders and Customers Migration...');
console.log('This will run in DRY RUN mode - no data will be migrated');
console.log('─'.repeat(50));

// Import and run the migration
const { runMigration } = require('./migrate-orders-customers');

runMigration().then(() => {
  console.log('\n✅ Test completed successfully!');
  console.log('If everything looks good, run the actual migration with:');
  console.log('   DRY_RUN=false node migrate-orders-customers.js');
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
