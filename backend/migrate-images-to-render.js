/**
 * Uploads local product images to the production Render backend
 * and updates the database URLs automatically.
 *
 * Run with: node migrate-images-to-render.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const PRODUCTION_API = 'https://tailoredhands-api.onrender.com/api';
const LOCAL_UPLOADS = path.join(__dirname, 'uploads', 'products');

// Admin credentials
const ADMIN_EMAIL = 'admin@tailoredhands.africa';
const ADMIN_PASSWORD = 'TailoredHands2024!';

async function login() {
  const res = await axios.post(`${PRODUCTION_API}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return res.data.token;
}

async function getProducts(token) {
  const res = await axios.get(`${PRODUCTION_API}/products`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 200 },
  });
  // Handle both array response and { products: [...] } shape
  return Array.isArray(res.data) ? res.data : res.data.products || [];
}

async function uploadProductImage(token, productId, localFilePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath), path.basename(localFilePath));

  const res = await axios.put(
    `${PRODUCTION_API}/upload/product/${productId}`,
    form,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
      timeout: 60000,
    }
  );
  return res.data;
}

async function main() {
  console.log('Connecting to production API...');

  let token;
  try {
    token = await login();
    console.log('Logged in successfully.\n');
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  let products;
  try {
    products = await getProducts(token);
    console.log(`Fetched ${products.length} products from production.`);
  } catch (err) {
    console.error('Failed to fetch products:', err.response?.data || err.message);
    process.exit(1);
  }

  const broken = products.filter(
    (p) => p.image_url && p.image_url.includes('supabase.co')
  );
  console.log(`Found ${broken.length} products with broken Supabase image URLs.\n`);

  if (broken.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  let success = 0;
  let failed = 0;
  let missing = 0;

  for (const product of broken) {
    const filename = path.basename(product.image_url);
    const localFile = path.join(LOCAL_UPLOADS, filename);

    if (!fs.existsSync(localFile)) {
      console.log(`  MISSING FILE  [${product.name}] → ${filename}`);
      missing++;
      continue;
    }

    process.stdout.write(`  Uploading [${product.name}]... `);
    try {
      await uploadProductImage(token, product.id, localFile);
      console.log('done');
      success++;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.log(`FAILED — ${msg}`);
      failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`  Uploaded:     ${success}`);
  console.log(`  Failed:       ${failed}`);
  console.log(`  Missing file: ${missing}`);
  console.log(`  Total:        ${broken.length}`);
}

main().catch(console.error);
