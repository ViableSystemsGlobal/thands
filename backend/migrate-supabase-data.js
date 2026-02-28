#!/usr/bin/env node

/**
 * Data Migration: Supabase → Local PostgreSQL
 *
 * Migrates consultations and messages from live Supabase into
 * the local (or production) PostgreSQL database.
 *
 * Usage:
 *   node migrate-supabase-data.js                    # all tables
 *   node migrate-supabase-data.js --table=consultations
 *   node migrate-supabase-data.js --table=messages
 *   node migrate-supabase-data.js --dry-run          # preview only
 *   node migrate-supabase-data.js --verbose          # show each row
 */

require('dotenv').config({ path: './.env' });

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN   = process.argv.includes('--dry-run');
const VERBOSE   = process.argv.includes('--verbose');
const PAGE_SIZE = 1000;

const tableArg   = process.argv.find(a => a.startsWith('--table='));
const ONLY_TABLE = tableArg ? tableArg.split('=')[1] : null;

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing Supabase credentials in backend/.env');
  process.exit(1);
}
if (SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')) {
  console.error('❌  VITE_SUPABASE_URL points to localhost — set it to your live Supabase URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '5432'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log  = (...a) => console.log(...a);
const vlog = (...a) => { if (VERBOSE) console.log(...a); };

async function fetchAll(table) {
  const rows = [];
  let from = 0;
  log(`\n📡  Fetching ${table} from Supabase...`);

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌  Supabase error on ${table}: ${error.message}`);
      throw error;
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    log(`    ${table}: fetched ${rows.length} so far...`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  log(`✅  ${table}: ${rows.length} total rows from Supabase`);
  return rows;
}

// ─── Consultations ────────────────────────────────────────────────────────────
// Supabase uses integer PK; local uses UUID — deduplicate on business fields

async function migrateConsultations(client) {
  const rows = await fetchAll('consultations');
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  const stats = { inserted: 0, skipped: 0 };

  for (const r of rows) {
    vlog(`  → consultation ${r.id} | ${r.email} | ${r.type} | ${r.status}`);
    if (DRY_RUN) { stats.inserted++; continue; }

    // Deduplicate: same email + type + same day (or exact preferred_date match)
    const dupe = await client.query(
      `SELECT id FROM consultations
       WHERE email = $1
         AND type  = $2
         AND created_at::date = $3::date`,
      [r.email, r.type, r.created_at || new Date().toISOString()]
    );

    if (dupe.rows.length > 0) {
      vlog(`    skipped (already exists): ${r.email}`);
      stats.skipped++;
      continue;
    }

    await client.query(
      `INSERT INTO consultations (
        name, email, phone, type, status, consultation_type,
        preferred_date, preferred_time, consultation_instructions,
        height, sizes, additional_instructions, design_urls, photo_urls,
        measurements_url, inspiration_url, photo_url,
        session_id, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )`,
      [
        r.name, r.email, r.phone || null,
        r.type, r.status || 'pending',
        r.consultation_type || r.type,
        r.preferred_date || null,
        r.preferred_time || null,
        r.consultation_instructions || null,
        r.height || null,
        r.sizes        ? JSON.stringify(r.sizes)        : null,
        r.additional_instructions || null,
        r.design_urls  ? JSON.stringify(r.design_urls)  : null,
        r.photo_urls   ? JSON.stringify(r.photo_urls)   : null,
        r.measurements_url || null,
        r.inspiration_url  || null,
        r.photo_url        || null,
        r.session_id       || null,
        r.created_at || new Date().toISOString(),
        r.updated_at || new Date().toISOString(),
      ]
    );
    stats.inserted++;
  }

  return stats;
}

// ─── Messages ─────────────────────────────────────────────────────────────────
// SERIAL PK on both sides — deduplicate on (email, subject, created_at date)

async function migrateMessages(client) {
  const rows = await fetchAll('messages');
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  const stats = { inserted: 0, skipped: 0 };

  for (const r of rows) {
    vlog(`  → message from ${r.email} | "${r.subject?.slice(0, 50)}"`);
    if (DRY_RUN) { stats.inserted++; continue; }

    const dupe = await client.query(
      `SELECT id FROM messages
       WHERE email = $1 AND subject = $2 AND created_at::date = $3::date`,
      [r.email, r.subject, r.created_at || new Date().toISOString()]
    );

    if (dupe.rows.length > 0) {
      vlog(`    skipped (already exists): ${r.email} — ${r.subject}`);
      stats.skipped++;
      continue;
    }

    await client.query(
      `INSERT INTO messages (name, email, subject, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        r.name, r.email, r.subject, r.message,
        // Supabase used 'unread'; local constraint uses 'new'
        r.status === 'unread' ? 'new' : (r.status || 'new'),
        r.created_at || new Date().toISOString(),
        r.updated_at || r.created_at || new Date().toISOString(),
      ]
    );
    stats.inserted++;
  }

  return stats;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════════════════');
  log('  Data Migration: Supabase → PostgreSQL');
  if (DRY_RUN)   log('  ⚠️   DRY RUN — no data will be written');
  if (ONLY_TABLE) log(`  📌  Only migrating: ${ONLY_TABLE}`);
  log('═══════════════════════════════════════════════════════');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const results = {};

    if (!ONLY_TABLE || ONLY_TABLE === 'consultations') {
      results.consultations = await migrateConsultations(client);
    }
    if (!ONLY_TABLE || ONLY_TABLE === 'messages') {
      results.messages = await migrateMessages(client);
    }

    if (!DRY_RUN) await client.query('COMMIT');
    else await client.query('ROLLBACK');

    log('\n─── Results ───────────────────────────────────────────');
    if (results.consultations) {
      const c = results.consultations;
      log(`  Consultations — inserted : ${c.inserted}`);
      log(`  Consultations — skipped  : ${c.skipped}`);
    }
    if (results.messages) {
      const m = results.messages;
      log(`  Messages      — inserted : ${m.inserted}`);
      log(`  Messages      — skipped  : ${m.skipped}`);
    }
    if (DRY_RUN) log('\n  Run without --dry-run to apply changes.');
    log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
