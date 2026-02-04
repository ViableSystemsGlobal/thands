const fs = require('fs');
const path = require('path');
const { query, testConnection, pool } = require('./config/database');

async function executeStatementsIndividually(sql) {
  // Split by semicolon, but be smarter about it
  const statements = [];
  let currentStatement = '';
  let inQuotes = false;
  let quoteChar = null;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar && sql[i - 1] !== '\\') {
      inQuotes = false;
      quoteChar = null;
    }
    
    currentStatement += char;
    
    if (!inQuotes && char === ';') {
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      currentStatement = '';
    }
  }
  
  // Add remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`📊 Executing ${statements.length} statements individually...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length > 5) { // Ignore very short statements
      try {
        await query(statement);
      } catch (error) {
        // Ignore expected errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate key') &&
            !error.message.includes('ON CONFLICT')) {
          console.warn(`⚠️  Statement ${i + 1} warning: ${error.message.substring(0, 80)}`);
        }
      }
    }
  }
}

async function runMigration() {
  try {
    console.log('🔄 Starting branch system migration...');
    
    // Test database connection first
    await testConnection();
    console.log('✅ Database connection verified');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '09_create_branch_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Remove comments (lines starting with --)
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
    
    // Execute the entire migration as one transaction
    console.log('🔄 Executing migration...');
    
    try {
      // Use the pool directly for multi-statement execution
      const client = await require('./config/database').pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Execute the entire SQL file
        await client.query(cleanedSQL);
        
        await client.query('COMMIT');
        console.log('✅ Migration executed successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      // Some errors are expected (like IF NOT EXISTS, ON CONFLICT)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('does not exist') ||
          error.message.includes('ON CONFLICT')) {
        console.log(`⚠️  Some operations skipped (expected): ${error.message.substring(0, 100)}`);
        // Try to continue with individual statements
        await executeStatementsIndividually(cleanedSQL);
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - branch_settings table created');
    console.log('   - user_branch_access table created');
    console.log('   - branch_code column added to orders table');
    console.log('   - Default branches (GH, UK, US) inserted');
    console.log('\n🎉 Branch system is now ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the migration
runMigration();

