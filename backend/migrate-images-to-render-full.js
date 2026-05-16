/**
 * FULL product image re-migration.
 *
 * Why this exists:
 *   Product images 404 in production. The production DB references image files
 *   that are not on the Render persistent disk (the disk overlays the git-tracked
 *   uploads/ folder, so only files uploaded through the running app are served).
 *   The earlier migrate-images-to-render.js only handled products whose URL still
 *   contained "supabase.co" — products already rewritten to /api/images UUID URLs
 *   were skipped, and their files were never (re)placed on the disk.
 *
 * What this does:
 *   - Reads the LOCAL Postgres DB for the id -> original image filename mapping
 *     (the local DB is the reliable source of truth; production URLs are not).
 *   - Resolves each product's source image in backend/uploads/products/.
 *   - Re-uploads EVERY product (regardless of current production URL format) via
 *     PUT /api/upload/product/:id, which re-processes the image, writes it to the
 *     persistent disk, and updates the production DB URL. DB + disk end up in sync.
 *
 * Run:
 *   node migrate-images-to-render-full.js --dry-run   # preview, no changes
 *   node migrate-images-to-render-full.js             # apply
 *
 * Optional env overrides (otherwise sensible defaults are used):
 *   PRODUCTION_API, MIGRATION_ADMIN_EMAIL, MIGRATION_ADMIN_PASSWORD
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { Pool } = require('pg');

const PRODUCTION_API = process.env.PRODUCTION_API || 'https://tailoredhands-api.onrender.com/api';
const ADMIN_EMAIL = process.env.MIGRATION_ADMIN_EMAIL || 'admin@tailoredhands.africa';
const ADMIN_PASSWORD = process.env.MIGRATION_ADMIN_PASSWORD || 'TailoredHands2024!';
const LOCAL_UPLOADS = path.join(__dirname, 'uploads', 'products');
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 400;       // pause between uploads to stay clear of rate limits
const MAX_RETRIES = 2;      // retry transient failures (cold starts, 429, 5xx)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Find the local source image for a product's image_url, if it exists. */
function resolveSourceFile(imageUrl) {
  if (!imageUrl) return null;
  const base = path.basename(imageUrl.split('?')[0]);
  const candidates = [
    path.join(LOCAL_UPLOADS, base),              // raw originals: 1753056326507-xxxx.png
    path.join(LOCAL_UPLOADS, 'original', base),  // processed: <id>-original.webp
  ];
  return candidates.find((f) => fs.existsSync(f)) || null;
}

async function getLocalProducts() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  try {
    const { rows } = await pool.query(
      'SELECT id, name, image_url FROM products ORDER BY created_at'
    );
    return rows;
  } finally {
    await pool.end();
  }
}

async function login() {
  const res = await axios.post(`${PRODUCTION_API}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!res.data.token) throw new Error('login response had no token');
  return res.data.token;
}

async function uploadProductImage(token, productId, localFilePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath), path.basename(localFilePath));
  const res = await axios.put(
    `${PRODUCTION_API}/upload/product/${productId}`,
    form,
    {
      headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
      timeout: 90000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return res.data;
}

/** Retry only on transient errors; a 4xx (other than 429) fails fast. */
function isTransient(err) {
  const status = err.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  if (!err.response) return true; // network / timeout
  return false;
}

async function uploadWithRetry(token, productId, localFilePath) {
  let attempt = 0;
  for (;;) {
    try {
      return await uploadProductImage(token, productId, localFilePath);
    } catch (err) {
      attempt++;
      if (attempt > MAX_RETRIES || !isTransient(err)) throw err;
      const backoff = 2000 * attempt;
      process.stdout.write(`retry ${attempt}/${MAX_RETRIES} in ${backoff}ms... `);
      await sleep(backoff);
    }
  }
}

async function main() {
  console.log(`\n=== Full product image re-migration ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  console.log(`Target: ${PRODUCTION_API}\n`);

  const products = await getLocalProducts();
  console.log(`Loaded ${products.length} products from local DB.`);

  const work = [];
  const missing = [];
  for (const p of products) {
    const src = resolveSourceFile(p.image_url);
    if (src) work.push({ ...p, src });
    else missing.push(p);
  }
  console.log(`  Source file found:   ${work.length}`);
  console.log(`  Source file MISSING: ${missing.length}`);
  missing.forEach((p) => console.log(`    - ${p.name} (${p.id}) -> ${p.image_url || '<null>'}`));

  if (DRY_RUN) {
    console.log('\nWould upload:');
    work.forEach((p) =>
      console.log(`  ${p.name.padEnd(28)} <- ${path.relative(__dirname, p.src)}`)
    );
    console.log(`\n${work.length} uploads pending. Re-run without --dry-run to apply.`);
    return;
  }

  if (work.length === 0) {
    console.log('\nNothing to upload.');
    return;
  }

  console.log('\nLogging in to production...');
  const token = await login();
  console.log('Logged in.\n');

  let ok = 0;
  const failures = [];
  for (let i = 0; i < work.length; i++) {
    const p = work[i];
    process.stdout.write(`[${i + 1}/${work.length}] ${p.name} ... `);
    try {
      const res = await uploadWithRetry(token, p.id, p.src);
      console.log(`done -> ${res.newImageUrl}`);
      ok++;
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.status || err.message;
      console.log(`FAILED - ${msg}`);
      failures.push({ name: p.name, id: p.id, msg });
    }
    await sleep(DELAY_MS);
  }

  console.log('\n--- Results ---');
  console.log(`  Uploaded:        ${ok}`);
  console.log(`  Failed:          ${failures.length}`);
  console.log(`  Missing source:  ${missing.length}`);
  if (failures.length) {
    console.log('\nFailures (safe to re-run the script — successful ones are idempotent):');
    failures.forEach((f) => console.log(`  - ${f.name} (${f.id}): ${f.msg}`));
  }
  if (missing.length) {
    console.log('\nNo local source image — re-upload these manually via the admin UI:');
    missing.forEach((p) => console.log(`  - ${p.name} (${p.id})`));
  }
}

main().catch((e) => {
  console.error('\nFatal:', e.response?.data || e.message);
  process.exit(1);
});
