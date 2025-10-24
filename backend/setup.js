const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up TailoredHands Local Database...\n');

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tailoredhands_local',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  };

  // First, connect to postgres database to create our database
  const adminConfig = {
    ...dbConfig,
    database: 'postgres' // Connect to default postgres database
  };

  const adminPool = new Pool(adminConfig);

  try {
    console.log('📊 Connecting to PostgreSQL...');
    
    // Check if database exists
    const dbExists = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );

    if (dbExists.rows.length === 0) {
      console.log(`📦 Creating database: ${dbConfig.database}`);
      await adminPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    adminPool.end();

    // Now connect to our database to run migrations
    const pool = new Pool(dbConfig);
    console.log('🔗 Connecting to TailoredHands database...');

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'migrations', '01_create_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running database migrations...');
    await pool.query(migrationSQL);
    console.log('✅ Database schema created successfully');

    // Test the setup
    console.log('\n🧪 Testing database setup...');
    
    // Test products table
    const productsResult = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`✅ Products table: ${productsResult.rows[0].count} records`);

    // Test categories table
    const categoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`✅ Categories table: ${categoriesResult.rows[0].count} records`);

    // Test settings table
    const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
    console.log(`✅ Settings table: ${settingsResult.rows[0].count} records`);

    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users table: ${usersResult.rows[0].count} records`);

    pool.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy config.env to .env and update your settings');
    console.log('2. Run: npm run dev');
    console.log('3. Test the API at: http://localhost:3001/api/health');
    console.log('4. Update your frontend to use the new API endpoints');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your database credentials in config.env');
    console.log('3. Ensure the postgres user has permission to create databases');
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
