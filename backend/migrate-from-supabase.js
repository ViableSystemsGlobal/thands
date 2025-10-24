#!/usr/bin/env node

/**
 * Migration Script: Supabase to PostgreSQL
 * 
 * This script migrates all products, categories, and related data
 * from Supabase to your local PostgreSQL database.
 * 
 * Usage:
 *   node migrate-from-supabase.js
 * 
 * Prerequisites:
 *   1. Supabase credentials in .env file
 *   2. Local PostgreSQL database running
 *   3. Backend server stopped (to avoid conflicts)
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './migration-config.env' });

// Configuration
const CONFIG = {
  // Supabase connection (from your .env file)
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY,
  
  // Local PostgreSQL connection
  LOCAL_DB: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },
  
  // Migration settings
  BATCH_SIZE: 50, // Process products in batches
  DRY_RUN: process.argv.includes('--dry-run'), // Test mode
  VERBOSE: process.argv.includes('--verbose'), // Detailed logging
};

// Validation
if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file');
  process.exit(1);
}

// Initialize connections
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
const localPool = new Pool(CONFIG.LOCAL_DB);

// Migration statistics
const stats = {
  categories: { total: 0, migrated: 0, errors: 0 },
  products: { total: 0, migrated: 0, errors: 0 },
  productSizes: { total: 0, migrated: 0, errors: 0 },
  startTime: Date.now(),
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄'
  }[type] || '📋';
  
  if (CONFIG.VERBOSE || type !== 'info') {
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
};

const logStats = () => {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  console.log('\n📊 Migration Statistics:');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📁 Categories: ${stats.categories.migrated}/${stats.categories.total} (${stats.categories.errors} errors)`);
  console.log(`🛍️  Products: ${stats.products.migrated}/${stats.products.total} (${stats.products.errors} errors)`);
  console.log(`📏 Product Sizes: ${stats.productSizes.migrated}/${stats.productSizes.total} (${stats.productSizes.errors} errors)`);
};

// Migration functions
async function migrateCategories() {
  log('Starting categories migration...', 'progress');
  
  try {
    // Since categories are stored as strings in products, we'll extract unique categories
    const { data: products, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    // Extract unique categories
    const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
    stats.categories.total = uniqueCategories.length;
    log(`Found ${stats.categories.total} unique categories in products`, 'info');

    if (CONFIG.DRY_RUN) {
      log('DRY RUN: Would migrate categories:', 'warning');
      uniqueCategories.forEach(cat => {
        console.log(`  - ${cat}`);
      });
      return uniqueCategories;
    }

    // Clear existing categories (if not dry run)
    await localPool.query('DELETE FROM categories');
    log('Cleared existing categories', 'info');

    // Migrate categories
    for (let i = 0; i < uniqueCategories.length; i++) {
      const categoryName = uniqueCategories[i];
      try {
        const categoryId = `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
        const insertQuery = `
          INSERT INTO categories (
            id, name, description, sort_order, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (name) DO UPDATE SET
            updated_at = EXCLUDED.updated_at
        `;

        await localPool.query(insertQuery, [
          categoryId,
          categoryName,
          `Category for ${categoryName}`,
          i + 1,
          true,
          new Date().toISOString(),
          new Date().toISOString()
        ]);

        stats.categories.migrated++;
        log(`Migrated category: ${categoryName}`, 'success');
      } catch (error) {
        stats.categories.errors++;
        log(`Error migrating category ${categoryName}: ${error.message}`, 'error');
      }
    }

    log(`Categories migration completed: ${stats.categories.migrated}/${stats.categories.total}`, 'success');
    return uniqueCategories;

  } catch (error) {
    log(`Categories migration failed: ${error.message}`, 'error');
    throw error;
  }
}

async function migrateProducts() {
  log('Starting products migration...', 'progress');
  
  try {
    // Fetch products from Supabase with sizes
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        product_sizes (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    stats.products.total = supabaseProducts?.length || 0;
    log(`Found ${stats.products.total} products in Supabase`, 'info');

    if (CONFIG.DRY_RUN) {
      log('DRY RUN: Would migrate products:', 'warning');
      supabaseProducts?.forEach(product => {
        console.log(`  - ${product.name} (${product.category}) - ${product.product_sizes?.length || 0} sizes`);
      });
      return supabaseProducts;
    }

    // Clear existing products (if not dry run)
    await localPool.query('DELETE FROM product_sizes');
    await localPool.query('DELETE FROM products');
    log('Cleared existing products and sizes', 'info');

    // Migrate products in batches
    const batches = [];
    for (let i = 0; i < supabaseProducts.length; i += CONFIG.BATCH_SIZE) {
      batches.push(supabaseProducts.slice(i, i + CONFIG.BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`, 'progress');

      for (const product of batch) {
        try {
          // Calculate base price from the first size or use a default
          const firstSize = product.product_sizes?.[0];
          const basePrice = firstSize ? parseFloat(firstSize.price) || 0 : 0;

          // Migrate product
          const productInsertQuery = `
            INSERT INTO products (
              id, name, description, category, price, image_url,
              is_active, stock_quantity, sku, weight,
              dimensions_length, dimensions_width, dimensions_height,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              category = EXCLUDED.category,
              price = EXCLUDED.price,
              image_url = EXCLUDED.image_url,
              is_active = EXCLUDED.is_active,
              stock_quantity = EXCLUDED.stock_quantity,
              sku = EXCLUDED.sku,
              weight = EXCLUDED.weight,
              dimensions_length = EXCLUDED.dimensions_length,
              dimensions_width = EXCLUDED.dimensions_width,
              dimensions_height = EXCLUDED.dimensions_height,
              updated_at = EXCLUDED.updated_at
          `;

          await localPool.query(productInsertQuery, [
            `00000000-0000-0000-0000-${String(product.id).padStart(12, '0')}`,
            product.name,
            product.description,
            product.category,
            basePrice,
            product.image_url,
            true, // Default to active
            0, // Default stock quantity
            null, // No SKU field in Supabase
            null, // No weight field in Supabase
            null, // No dimensions in Supabase
            null,
            null,
            product.created_at,
            product.updated_at || product.created_at
          ]);

          stats.products.migrated++;

          // Migrate product sizes
          if (product.product_sizes && product.product_sizes.length > 0) {
            for (const size of product.product_sizes) {
              try {
                const sizeInsertQuery = `
                  INSERT INTO product_sizes (
                    id, product_id, size, price_adjustment,
                    stock_quantity, is_available, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (id) DO UPDATE SET
                    product_id = EXCLUDED.product_id,
                    size = EXCLUDED.size,
                    price_adjustment = EXCLUDED.price_adjustment,
                    stock_quantity = EXCLUDED.stock_quantity,
                    is_available = EXCLUDED.is_available
                `;

                // Calculate price adjustment from the size price vs base product price
                const sizePrice = parseFloat(size.price) || 0;
                const priceAdjustment = sizePrice - basePrice;

                await localPool.query(sizeInsertQuery, [
                  `00000000-0000-0000-0000-${String(size.id).padStart(12, '0')}`,
                  `00000000-0000-0000-0000-${String(product.id).padStart(12, '0')}`, // Use the product ID
                  size.size,
                  priceAdjustment,
                  10, // Default stock quantity
                  true, // Default to available
                  size.created_at
                ]);

                stats.productSizes.migrated++;
              } catch (sizeError) {
                stats.productSizes.errors++;
                log(`Error migrating size ${size.size} for product ${product.name}: ${sizeError.message}`, 'error');
              }
            }
          }

          log(`Migrated product: ${product.name}`, 'success');

        } catch (error) {
          stats.products.errors++;
          log(`Error migrating product ${product.name}: ${error.message}`, 'error');
        }
      }
    }

    log(`Products migration completed: ${stats.products.migrated}/${stats.products.total}`, 'success');
    return supabaseProducts;

  } catch (error) {
    log(`Products migration failed: ${error.message}`, 'error');
    throw error;
  }
}

async function verifyMigration() {
  log('Verifying migration...', 'progress');
  
  try {
    // Count records in local database
    const categoryCount = await localPool.query('SELECT COUNT(*) FROM categories');
    const productCount = await localPool.query('SELECT COUNT(*) FROM products');
    const sizeCount = await localPool.query('SELECT COUNT(*) FROM product_sizes');

    log(`Verification complete:`, 'success');
    log(`  Categories: ${categoryCount.rows[0].count}`, 'info');
    log(`  Products: ${productCount.rows[0].count}`, 'info');
    log(`  Product Sizes: ${sizeCount.rows[0].count}`, 'info');

    // Test a sample query
    const sampleProduct = await localPool.query(`
      SELECT p.name, p.category, COUNT(ps.id) as size_count
      FROM products p
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
      GROUP BY p.id, p.name, p.category
      LIMIT 3
    `);

    log('Sample migrated products:', 'info');
    sampleProduct.rows.forEach(product => {
      console.log(`  - ${product.name} (${product.category}) - ${product.size_count} sizes`);
    });

  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
  }
}

// Main migration function
async function runMigration() {
  try {
    log('🚀 Starting Supabase to PostgreSQL migration...', 'progress');
    log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`, 'warning');
    
    // Test connections
    log('Testing database connections...', 'progress');
    await supabase.from('categories').select('count').limit(1);
    await localPool.query('SELECT 1');
    log('Database connections verified', 'success');

    // Run migration steps
    await migrateCategories();
    await migrateProducts();
    await verifyMigration();

    log('🎉 Migration completed successfully!', 'success');
    logStats();

  } catch (error) {
    log(`💥 Migration failed: ${error.message}`, 'error');
    logStats();
    process.exit(1);
  } finally {
    await localPool.end();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  log('Migration interrupted by user', 'warning');
  logStats();
  await localPool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, CONFIG };
