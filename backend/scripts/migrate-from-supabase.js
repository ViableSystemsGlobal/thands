/**
 * Supabase → Render PostgreSQL data migration
 * Handles schema differences:
 * - Products: Supabase integer IDs → Render UUIDs (with mapping)
 * - Products: price lives in product_sizes in Supabase → base price derived
 * - Collections: Render uses serial integer + required slug
 * - Newsletter: Render uses serial integer
 *
 * Run: node backend/scripts/migrate-from-supabase.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = 'https://fqnzrffsscrhknfzewxd.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbnpyZmZzc2NyaGtuZnpld3hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDM0Njg2NywiZXhwIjoyMDU5OTIyODY3fQ.ZseTypRwx0a8X-VgTiluqCGW1GIhVPpLE_F6O--HUm0';

const RENDER_DB_URL = 'postgresql://tailoredhands:Y5cp7LL2vRT3s65ERHVHjUfp2QZWQCtp@dpg-d6t5uea4d50c73c3lcv0-a.oregon-postgres.render.com/tailoredhands';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const pool = new Pool({ connectionString: RENDER_DB_URL, ssl: { rejectUnauthorized: false } });

// Map: supabase_product_id (integer) → render UUID
const productIdMap = {};
// Map: supabase_customer_id → render UUID
const customerIdMap = {};
// Map: supabase_order_id (integer) → render UUID
const orderIdMap = {};

let migrated = 0;
let errors = 0;

async function run(label, fn) {
  console.log(`\n⏳ Migrating ${label}...`);
  try {
    const count = await fn();
    console.log(`✅ ${label}: ${count} rows`);
    migrated += count;
  } catch (err) {
    console.error(`❌ ${label} failed:`, err.message);
    errors++;
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Products ─────────────────────────────────────────────────────────────────
// Supabase products have NO price — price is per-size in product_sizes
async function migrateProducts() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) throw error;
  if (!products?.length) return 0;

  // Fetch all sizes to derive base price per product
  const { data: sizes } = await supabase.from('product_sizes').select('product_id, price');
  const sizePricesByProduct = {};
  for (const s of sizes || []) {
    if (!sizePricesByProduct[s.product_id]) sizePricesByProduct[s.product_id] = [];
    sizePricesByProduct[s.product_id].push(parseFloat(s.price) || 0);
  }

  for (const p of products) {
    const renderUuid = uuidv4();
    productIdMap[p.id] = renderUuid;

    const prices = sizePricesByProduct[p.id] || [0];
    const basePrice = Math.min(...prices);

    await pool.query(
      `INSERT INTO products (
        id, name, description, category, price, image_url,
        is_active, stock_quantity, product_type, is_featured,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, price=EXCLUDED.price, updated_at=EXCLUDED.updated_at`,
      [
        renderUuid, p.name, p.description || null, p.category || null,
        basePrice, p.image_url || null,
        true, 0,
        p.product_type || 'made_to_measure', p.is_featured ?? false,
        p.created_at, p.updated_at
      ]
    );
  }
  return products.length;
}

// ── Product Sizes ─────────────────────────────────────────────────────────────
async function migrateProductSizes() {
  const { data, error } = await supabase.from('product_sizes').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  // Get base prices per product (min price = base)
  const basePrices = {};
  for (const s of data) {
    const p = parseFloat(s.price) || 0;
    if (basePrices[s.product_id] === undefined || p < basePrices[s.product_id]) {
      basePrices[s.product_id] = p;
    }
  }

  let count = 0;
  for (const s of data) {
    const renderProductId = productIdMap[s.product_id];
    if (!renderProductId) { console.warn(`  ⚠️  No product mapping for size product_id=${s.product_id}`); continue; }

    const basePrice = basePrices[s.product_id] || 0;
    const sizePrice = parseFloat(s.price) || 0;
    const priceAdjustment = sizePrice - basePrice;

    await pool.query(
      `INSERT INTO product_sizes (product_id, size, price_adjustment, stock_quantity, is_available, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (product_id, size) DO UPDATE SET price_adjustment=EXCLUDED.price_adjustment`,
      [renderProductId, s.size, priceAdjustment, 0, true, s.created_at]
    );
    count++;
  }
  return count;
}

// ── Customers ─────────────────────────────────────────────────────────────────
async function migrateCustomers() {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  for (const c of data) {
    // Supabase customer IDs may be UUIDs — check
    let renderUuid = c.id;
    if (!c.id || c.id.toString().length < 10) {
      renderUuid = uuidv4(); // generate if integer
    }
    customerIdMap[c.id] = renderUuid;

    await pool.query(
      `INSERT INTO customers (id, email, first_name, last_name, phone, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET
         first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
         updated_at=EXCLUDED.updated_at`,
      [renderUuid, c.email, c.first_name || null, c.last_name || null,
       c.phone || null, c.created_at, c.updated_at]
    );
    customerIdMap[c.id] = renderUuid;
  }
  return data.length;
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function migrateOrders() {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  for (const o of data) {
    const renderOrderUuid = uuidv4();
    orderIdMap[o.id] = renderOrderUuid;

    let customerId = o.customer_id ? (customerIdMap[o.customer_id] || o.customer_id) : null;

    await pool.query(
      `INSERT INTO orders (
        id, order_number, customer_id, status, payment_status,
        payment_method, payment_reference,
        base_subtotal, base_shipping, base_total, total_amount_ghs, exchange_rate,
        shipping_email, shipping_phone, shipping_first_name, shipping_last_name,
        shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        billing_email, billing_first_name, billing_last_name,
        billing_address, billing_city, billing_state, billing_postal_code, billing_country,
        voucher_code, voucher_discount, notes, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,$28,$29,
        $30,$31,$32,$33,$34
      )
      ON CONFLICT (id) DO UPDATE SET
        status=EXCLUDED.status, payment_status=EXCLUDED.payment_status,
        updated_at=EXCLUDED.updated_at`,
      [
        renderOrderUuid, o.order_number, customerId,
        o.status || 'pending', o.payment_status || 'pending',
        o.payment_gateway || o.payment_method || null, o.payment_reference || null,
        o.base_subtotal || 0, o.base_shipping || 0, o.base_total || o.total_amount || 0,
        o.total_amount_ghs || null, o.exchange_rate || null,
        o.shipping_email || null, o.shipping_phone || null,
        o.shipping_first_name || null, o.shipping_last_name || null,
        o.shipping_address || null, o.shipping_city || null,
        o.shipping_state || null, o.shipping_postal_code || null, o.shipping_country || null,
        o.billing_email || null, o.billing_first_name || null, o.billing_last_name || null,
        o.billing_address || null, o.billing_city || null,
        o.billing_state || null, o.billing_postal_code || null, o.billing_country || null,
        o.gift_voucher_code || null,
        o.gift_voucher_redemption_amount || o.coupon_discount_amount || 0,
        o.order_notes || null, o.created_at, o.updated_at
      ]
    );
  }
  return data.length;
}

// ── Order Items ───────────────────────────────────────────────────────────────
async function migrateOrderItems() {
  const { data, error } = await supabase.from('order_items').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  let count = 0;
  for (const item of data) {
    const renderOrderId = orderIdMap[item.order_id];
    if (!renderOrderId) { console.warn(`  ⚠️  order_item ${item.id}: no order mapping for order_id=${item.order_id}, skipping`); continue; }

    let productId = item.product_id
      ? (productIdMap[item.product_id] || item.product_id)
      : null;

    const isGiftVoucher = !!item.gift_voucher_type_id && !productId;

    if (!productId && !isGiftVoucher) {
      console.warn(`  ⚠️  order_item ${item.id}: no product_id, skipping`);
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, gift_voucher_type_id, quantity, size, price, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          renderOrderId,
          isGiftVoucher ? null : productId,
          isGiftVoucher ? item.gift_voucher_type_id : null,
          item.quantity || 1, item.size || null,
          item.price || 0, item.created_at
        ]
      );

      count++;
    } catch (e) {
      console.warn(`  ⚠️  order_item ${item.id}: ${e.message}`);
    }
  }
  return count;
}

// ── Collections ───────────────────────────────────────────────────────────────
// Render uses serial integer + required slug
async function migrateCollections() {
  const { data, error } = await supabase.from('collections').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  for (const c of data) {
    const slug = slugify(c.name);
    await pool.query(
      `INSERT INTO collections (name, description, image_url, slug, is_active, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, description=EXCLUDED.description,
         image_url=EXCLUDED.image_url, updated_at=EXCLUDED.updated_at`,
      [
        c.name, c.description || null, c.image_url || null,
        slug, c.is_active ?? true, c.sort_order ?? 0,
        c.created_at, c.updated_at
      ]
    );
  }
  return data.length;
}

// ── Newsletter ────────────────────────────────────────────────────────────────
async function migrateNewsletter() {
  const { data, error } = await supabase.from('newsletter_subscribers').select('*');
  if (error) { console.warn('  ⚠️  newsletter_subscribers not in Supabase, skipping'); return 0; }
  if (!data?.length) return 0;

  for (const s of data) {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, source, subscribed_at, is_active)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING`,
      [s.email, s.source || 'website', s.subscribed_at || s.created_at, s.is_active ?? true]
    );
  }
  return data.length;
}

// ── Knowledge Base ────────────────────────────────────────────────────────────
async function migrateKnowledgeBase() {
  const { data, error } = await supabase.from('knowledge_base').select('*');
  if (error) { console.warn('  ⚠️  knowledge_base not in Supabase, skipping'); return 0; }
  if (!data?.length) return 0;

  for (const k of data) {
    await pool.query(
      `INSERT INTO knowledge_base (id, title, content, category, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content`,
      [k.id, k.title, k.content, k.category || null, k.is_active ?? true, k.created_at, k.updated_at]
    );
  }
  return data.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Starting Supabase → Render PostgreSQL migration...\n');

  // Order matters: products before sizes, customers before orders, orders before items
  await run('products', migrateProducts);
  await run('product_sizes', migrateProductSizes);
  await run('customers', migrateCustomers);
  await run('orders', migrateOrders);
  await run('order_items', migrateOrderItems);
  await run('collections', migrateCollections);
  await run('newsletter_subscribers', migrateNewsletter);
  await run('knowledge_base', migrateKnowledgeBase);

  console.log('\n─────────────────────────────────');
  console.log(`✅ Migrated: ${migrated} rows`);
  if (errors > 0) console.log(`❌ Errors:   ${errors} tables`);
  console.log('─────────────────────────────────\n');

  await pool.end();
  process.exit(errors > 0 ? 1 : 0);
})();
