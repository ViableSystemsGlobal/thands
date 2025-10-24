#!/usr/bin/env node

/**
 * Migrate Orders and Customers from Supabase to PostgreSQL
 * This script migrates all order-related data including:
 * - Users (customers)
 * - Customers table
 * - Orders
 * - Order items
 * - Cart items
 * - Wishlist items
 */

require('dotenv').config({ path: './migration-config.env' });
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL setup
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 50;
const DRY_RUN = process.env.DRY_RUN === 'true';
const VERBOSE = process.env.VERYBOSE === 'true';

console.log('🚀 Starting Orders and Customers Migration');
console.log(`📊 Batch size: ${BATCH_SIZE}`);
console.log(`🧪 Dry run: ${DRY_RUN}`);
console.log('─'.repeat(50));

// Helper function to execute queries
const query = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Helper function to generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to log progress
const log = (message, data = null) => {
  if (VERBOSE || data) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};

// Migration functions
const migrateUsers = async () => {
  console.log('👥 Migrating Users...');
  
  try {
    // Get all users from Supabase auth.users
    const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users from Supabase:', error);
      return [];
    }

    if (!supabaseUsers || supabaseUsers.users.length === 0) {
      console.log('ℹ️  No users found in Supabase');
      return [];
    }

    console.log(`📦 Found ${supabaseUsers.users.length} users in Supabase`);

    const migratedUsers = [];
    
    for (const user of supabaseUsers.users) {
      try {
        // Check if user already exists in PostgreSQL
        const existingUser = await query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );

        if (existingUser.rows.length > 0) {
          log(`⏭️  User ${user.email} already exists, skipping`);
          migratedUsers.push({
            supabaseId: user.id,
            postgresId: existingUser.rows[0].id,
            email: user.email
          });
          continue;
        }

        if (!DRY_RUN) {
          // Insert user into PostgreSQL
          const userResult = await query(`
            INSERT INTO users (
              id, email, password_hash, full_name, role, is_active, 
              email_verified, last_sign_in, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
          `, [
            generateUUID(), // Generate new UUID for PostgreSQL
            user.email,
            user.encrypted_password || 'migrated-password-hash', // Supabase doesn't expose actual passwords
            user.user_metadata?.full_name || user.user_metadata?.name,
            user.user_metadata?.role || 'customer',
            user.email_confirmed_at ? true : false,
            !!user.email_confirmed_at,
            user.last_sign_in_at,
            user.created_at,
            user.updated_at || user.created_at
          ]);

          const postgresId = userResult.rows[0].id;
          
          // Create profile if user metadata exists
          if (user.user_metadata) {
            await query(`
              INSERT INTO profiles (
                user_id, first_name, last_name, phone, 
                avatar_url, date_of_birth, gender, preferences, 
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              postgresId,
              user.user_metadata.first_name,
              user.user_metadata.last_name,
              user.user_metadata.phone,
              user.user_metadata.avatar_url,
              user.user_metadata.date_of_birth,
              user.user_metadata.gender,
              JSON.stringify(user.user_metadata.preferences || {}),
              user.created_at,
              user.updated_at || user.created_at
            ]);
          }

          migratedUsers.push({
            supabaseId: user.id,
            postgresId: postgresId,
            email: user.email
          });

          log(`✅ Migrated user: ${user.email}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate user: ${user.email}`);
          migratedUsers.push({
            supabaseId: user.id,
            postgresId: 'dry-run-id',
            email: user.email
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Users migration completed: ${migratedUsers.length} users processed`);
    return migratedUsers;

  } catch (error) {
    console.error('❌ Error in users migration:', error);
    return [];
  }
};

const migrateCustomers = async (userMapping) => {
  console.log('👤 Migrating Customers...');
  
  try {
    // Get customers from Supabase
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching customers from Supabase:', error);
      return [];
    }

    if (!customers || customers.length === 0) {
      console.log('ℹ️  No customers found in Supabase');
      return [];
    }

    console.log(`📦 Found ${customers.length} customers in Supabase`);

    const migratedCustomers = [];
    
    for (const customer of customers) {
      try {
        // Check if customer already exists
        const existingCustomer = await query(
          'SELECT id FROM customers WHERE email = $1',
          [customer.email]
        );

        if (existingCustomer.rows.length > 0) {
          log(`⏭️  Customer ${customer.email} already exists, skipping`);
          migratedCustomers.push({
            supabaseId: customer.id,
            postgresId: existingCustomer.rows[0].id,
            email: customer.email
          });
          continue;
        }

        // Find corresponding user_id in our mapping
        const userMappingEntry = userMapping.find(u => u.email === customer.email);
        const userId = userMappingEntry ? userMappingEntry.postgresId : null;

        if (!DRY_RUN) {
          const customerResult = await query(`
            INSERT INTO customers (
              id, user_id, email, first_name, last_name, phone, 
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            generateUUID(),
            userId,
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.phone,
            customer.created_at,
            customer.updated_at || customer.created_at
          ]);

          const postgresId = customerResult.rows[0].id;
          
          migratedCustomers.push({
            supabaseId: customer.id,
            postgresId: postgresId,
            email: customer.email
          });

          log(`✅ Migrated customer: ${customer.email}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate customer: ${customer.email}`);
          migratedCustomers.push({
            supabaseId: customer.id,
            postgresId: 'dry-run-id',
            email: customer.email
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating customer ${customer.email}:`, error.message);
      }
    }

    console.log(`✅ Customers migration completed: ${migratedCustomers.length} customers processed`);
    return migratedCustomers;

  } catch (error) {
    console.error('❌ Error in customers migration:', error);
    return [];
  }
};

const migrateOrders = async (customerMapping) => {
  console.log('📦 Migrating Orders...');
  
  try {
    // Get orders from Supabase
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching orders from Supabase:', error);
      return [];
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️  No orders found in Supabase');
      return [];
    }

    console.log(`📦 Found ${orders.length} orders in Supabase`);

    const migratedOrders = [];
    
    for (const order of orders) {
      try {
        // Check if order already exists
        const existingOrder = await query(
          'SELECT id FROM orders WHERE order_number = $1',
          [order.order_number]
        );

        if (existingOrder.rows.length > 0) {
          log(`⏭️  Order ${order.order_number} already exists, skipping`);
          migratedOrders.push({
            supabaseId: order.id,
            postgresId: existingOrder.rows[0].id,
            orderNumber: order.order_number
          });
          continue;
        }

        // Find corresponding customer_id in our mapping
        const customerMappingEntry = customerMapping.find(c => c.supabaseId === order.customer_id);
        const customerId = customerMappingEntry ? customerMappingEntry.postgresId : null;

        if (!DRY_RUN) {
          const orderResult = await query(`
            INSERT INTO orders (
              id, order_number, customer_id, user_id, status, payment_status,
              payment_method, payment_reference, base_subtotal, base_shipping,
              base_tax, base_total, total_amount_ghs, exchange_rate,
              shipping_email, shipping_phone, shipping_first_name, shipping_last_name,
              shipping_address, shipping_city, shipping_state, shipping_postal_code,
              shipping_country, billing_email, billing_first_name, billing_last_name,
              billing_address, billing_city, billing_state, billing_postal_code,
              billing_country, voucher_code, voucher_discount, notes,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36
            )
            RETURNING id
          `, [
            generateUUID(),
            order.order_number,
            customerId,
            customerId, // Use customer_id as user_id for now
            order.status,
            order.payment_status,
            order.payment_method,
            order.payment_reference,
            order.subtotal || 0,
            order.shipping_cost || 0,
            order.tax || 0,
            order.total || 0,
            order.total_amount_ghs,
            order.exchange_rate,
            order.shipping_email,
            order.shipping_phone,
            order.shipping_first_name,
            order.shipping_last_name,
            order.shipping_address,
            order.shipping_city,
            order.shipping_state,
            order.shipping_postal_code,
            order.shipping_country,
            order.billing_email,
            order.billing_first_name,
            order.billing_last_name,
            order.billing_address,
            order.billing_city,
            order.billing_state,
            order.billing_postal_code,
            order.billing_country,
            order.voucher_code,
            order.voucher_discount || 0,
            order.notes,
            order.created_at,
            order.updated_at || order.created_at
          ]);

          const postgresId = orderResult.rows[0].id;
          
          migratedOrders.push({
            supabaseId: order.id,
            postgresId: postgresId,
            orderNumber: order.order_number
          });

          log(`✅ Migrated order: ${order.order_number}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate order: ${order.order_number}`);
          migratedOrders.push({
            supabaseId: order.id,
            postgresId: 'dry-run-id',
            orderNumber: order.order_number
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating order ${order.order_number}:`, error.message);
      }
    }

    console.log(`✅ Orders migration completed: ${migratedOrders.length} orders processed`);
    return migratedOrders;

  } catch (error) {
    console.error('❌ Error in orders migration:', error);
    return [];
  }
};

const migrateOrderItems = async (orderMapping) => {
  console.log('🛍️ Migrating Order Items...');
  
  try {
    // Get order items from Supabase
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching order items from Supabase:', error);
      return [];
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('ℹ️  No order items found in Supabase');
      return [];
    }

    console.log(`📦 Found ${orderItems.length} order items in Supabase`);

    const migratedItems = [];
    
    for (const item of orderItems) {
      try {
        // Find corresponding order_id in our mapping
        const orderMappingEntry = orderMapping.find(o => o.supabaseId === item.order_id);
        if (!orderMappingEntry) {
          log(`⚠️  Order not found for order item: ${item.id}`);
          continue;
        }

        // Check if order item already exists (by order_id and product_id combination)
        const existingItem = await query(
          'SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2 AND size = $3',
          [orderMappingEntry.postgresId, item.product_id, item.size || null]
        );

        if (existingItem.rows.length > 0) {
          log(`⏭️  Order item already exists for order ${orderMappingEntry.orderNumber}, skipping`);
          continue;
        }

        if (!DRY_RUN) {
          await query(`
            INSERT INTO order_items (
              order_id, product_id, quantity, size, price, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            orderMappingEntry.postgresId,
            item.product_id,
            item.quantity,
            item.size,
            item.price,
            item.created_at
          ]);

          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'inserted',
            orderId: orderMappingEntry.postgresId
          });

          log(`✅ Migrated order item for order: ${orderMappingEntry.orderNumber}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate order item for order: ${orderMappingEntry.orderNumber}`);
          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'dry-run-id',
            orderId: orderMappingEntry.postgresId
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating order item ${item.id}:`, error.message);
      }
    }

    console.log(`✅ Order items migration completed: ${migratedItems.length} items processed`);
    return migratedItems;

  } catch (error) {
    console.error('❌ Error in order items migration:', error);
    return [];
  }
};

const migrateCartItems = async (userMapping) => {
  console.log('🛒 Migrating Cart Items...');
  
  try {
    // Get cart items from Supabase
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('*')
      .order('added_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching cart items from Supabase:', error);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      console.log('ℹ️  No cart items found in Supabase');
      return [];
    }

    console.log(`📦 Found ${cartItems.length} cart items in Supabase`);

    const migratedItems = [];
    
    for (const item of cartItems) {
      try {
        // Find corresponding user_id in our mapping if user_id exists
        let userId = null;
        if (item.user_id) {
          // Handle both string and integer user_ids from Supabase
          const userMappingEntry = userMapping.find(u => 
            u.supabaseId === item.user_id || u.supabaseId === item.user_id.toString()
          );
          userId = userMappingEntry ? userMappingEntry.postgresId : null;
        }

        // Check if cart item already exists
        const existingItem = await query(
          'SELECT id FROM cart_items WHERE session_id = $1 AND product_id = $2 AND size = $3',
          [item.session_id, item.product_id, item.size]
        );

        if (existingItem.rows.length > 0) {
          log(`⏭️  Cart item already exists for session ${item.session_id}, skipping`);
          continue;
        }

        if (!DRY_RUN) {
          await query(`
            INSERT INTO cart_items (
              id, session_id, user_id, product_id, quantity, size, added_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            generateUUID(),
            item.session_id,
            userId,
            item.product_id,
            item.quantity,
            item.size,
            item.added_at
          ]);

          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'inserted',
            sessionId: item.session_id
          });

          log(`✅ Migrated cart item for session: ${item.session_id}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate cart item for session: ${item.session_id}`);
          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'dry-run-id',
            sessionId: item.session_id
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating cart item ${item.id}:`, error.message);
      }
    }

    console.log(`✅ Cart items migration completed: ${migratedItems.length} items processed`);
    return migratedItems;

  } catch (error) {
    console.error('❌ Error in cart items migration:', error);
    return [];
  }
};

const migrateWishlistItems = async (userMapping) => {
  console.log('❤️ Migrating Wishlist Items...');
  
  try {
    // Get wishlist items from Supabase
    const { data: wishlistItems, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .order('saved_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching wishlist items from Supabase:', error);
      return [];
    }

    if (!wishlistItems || wishlistItems.length === 0) {
      console.log('ℹ️  No wishlist items found in Supabase');
      return [];
    }

    console.log(`📦 Found ${wishlistItems.length} wishlist items in Supabase`);

    const migratedItems = [];
    
    for (const item of wishlistItems) {
      try {
        // Find corresponding user_id in our mapping if user_id exists
        let userId = null;
        if (item.user_id) {
          // Handle both string and integer user_ids from Supabase
          const userMappingEntry = userMapping.find(u => 
            u.supabaseId === item.user_id || u.supabaseId === item.user_id.toString()
          );
          userId = userMappingEntry ? userMappingEntry.postgresId : null;
        }

        // Check if wishlist item already exists
        const existingItem = await query(
          'SELECT id FROM wishlist_items WHERE session_id = $1 AND product_id = $2',
          [item.session_id, item.product_id]
        );

        if (existingItem.rows.length > 0) {
          log(`⏭️  Wishlist item already exists for session ${item.session_id}, skipping`);
          continue;
        }

        if (!DRY_RUN) {
          await query(`
            INSERT INTO wishlist_items (
              id, session_id, user_id, product_id, added_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            generateUUID(),
            item.session_id,
            userId,
            item.product_id,
            item.saved_at || item.added_at
          ]);

          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'inserted',
            sessionId: item.session_id
          });

          log(`✅ Migrated wishlist item for session: ${item.session_id}`);
        } else {
          log(`🧪 [DRY RUN] Would migrate wishlist item for session: ${item.session_id}`);
          migratedItems.push({
            supabaseId: item.id,
            postgresId: 'dry-run-id',
            sessionId: item.session_id
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating wishlist item ${item.id}:`, error.message);
      }
    }

    console.log(`✅ Wishlist items migration completed: ${migratedItems.length} items processed`);
    return migratedItems;

  } catch (error) {
    console.error('❌ Error in wishlist items migration:', error);
    return [];
  }
};

// Main migration function
const runMigration = async () => {
  try {
    console.log('🚀 Starting comprehensive orders and customers migration...\n');

    // Step 1: Migrate users first (they're referenced by other tables)
    const userMapping = await migrateUsers();
    console.log(`✅ User mapping created: ${userMapping.length} users\n`);

    // Step 2: Migrate customers
    const customerMapping = await migrateCustomers(userMapping);
    console.log(`✅ Customer mapping created: ${customerMapping.length} customers\n`);

    // Step 3: Migrate orders
    const orderMapping = await migrateOrders(customerMapping);
    console.log(`✅ Order mapping created: ${orderMapping.length} orders\n`);

    // Step 4: Migrate order items
    const orderItemsResult = await migrateOrderItems(orderMapping);
    console.log(`✅ Order items migrated: ${orderItemsResult.length} items\n`);

    // Step 5: Migrate cart items
    const cartItemsResult = await migrateCartItems(userMapping);
    console.log(`✅ Cart items migrated: ${cartItemsResult.length} items\n`);

    // Step 6: Migrate wishlist items
    const wishlistItemsResult = await migrateWishlistItems(userMapping);
    console.log(`✅ Wishlist items migrated: ${wishlistItemsResult.length} items\n`);

    console.log('🎉 Migration completed successfully!');
    console.log('─'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   👥 Users: ${userMapping.length}`);
    console.log(`   👤 Customers: ${customerMapping.length}`);
    console.log(`   📦 Orders: ${orderMapping.length}`);
    console.log(`   🛍️ Order Items: ${orderItemsResult.length}`);
    console.log(`   🛒 Cart Items: ${cartItemsResult.length}`);
    console.log(`   ❤️ Wishlist Items: ${wishlistItemsResult.length}`);

    if (DRY_RUN) {
      console.log('\n🧪 This was a DRY RUN - no data was actually migrated.');
      console.log('   Set DRY_RUN=false in migration-config.env to perform actual migration.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
