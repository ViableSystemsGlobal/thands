#!/usr/bin/env node

/**
 * Newsletter Migration: Supabase → Local PostgreSQL
 *
 * Pulls newsletter_subscribers from live Supabase and upserts them
 * into the local (or production) PostgreSQL database.
 *
 * Usage:
 *   node migrate-newsletter.js              # live run
 *   node migrate-newsletter.js --dry-run   # preview without writing
 *   node migrate-newsletter.js --verbose   # show each email processed
 *
 * Prerequisites:
 *   VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY must be set in
 *   backend/.env (or passed as environment variables).
 */

require('dotenv').config({ path: './.env' });

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN  = process.argv.includes('--dry-run');
const VERBOSE  = process.argv.includes('--verbose');
const PAGE_SIZE = 1000; // Supabase max rows per request

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing Supabase credentials.');
  console.error('    Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in backend/.env');
  process.exit(1);
}

if (SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')) {
  console.error('❌  VITE_SUPABASE_URL points to localhost — that is the local dev Supabase, not production.');
  console.error('    Update VITE_SUPABASE_URL to your live Supabase project URL (https://<ref>.supabase.co)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const localPool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '5432'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log   = (...args) => console.log(...args);
const vlog  = (...args) => { if (VERBOSE) console.log(...args); };
const elog  = (...args) => console.error(...args);

// ─── Fetch all subscribers from Supabase (handles pagination) ─────────────────

async function fetchAllFromSupabase() {
  const allRows = [];
  let from = 0;

  log(`\n📡  Fetching newsletter subscribers from Supabase...`);
  log(`    URL: ${SUPABASE_URL}\n`);

  while (true) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, source, is_active, subscribed_at, created_at')
      .range(from, from + PAGE_SIZE - 1)
      .order('subscribed_at', { ascending: true });

    if (error) {
      // Table might not exist on Supabase or have a different name
      elog(`❌  Supabase query error: ${error.message}`);
      elog(`    (If the table doesn't exist in Supabase, there are no subscribers to migrate)`);
      throw error;
    }

    if (!data || data.length === 0) break;

    allRows.push(...data);
    log(`    Fetched ${allRows.length} rows so far...`);

    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  log(`✅  Total subscribers fetched from Supabase: ${allRows.length}\n`);
  return allRows;
}

// ─── Upsert into local PostgreSQL ─────────────────────────────────────────────

async function upsertSubscribers(rows) {
  if (rows.length === 0) {
    log('ℹ️   No subscribers to migrate.');
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const client = await localPool.connect();
  const stats  = { inserted: 0, updated: 0, errors: 0 };

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const { email, source, is_active, subscribed_at, created_at } = row;

      if (!email || !email.includes('@')) {
        vlog(`  ⚠️  Skipping invalid email: ${email}`);
        continue;
      }

      vlog(`  → ${email} (active=${is_active}, source=${source})`);

      if (DRY_RUN) {
        stats.inserted++;
        continue;
      }

      // Check if already exists locally
      const existing = await client.query(
        'SELECT id, is_active FROM newsletter_subscribers WHERE email = $1',
        [email]
      );

      if (existing.rows.length === 0) {
        // New subscriber
        await client.query(
          `INSERT INTO newsletter_subscribers
             (email, source, is_active, subscribed_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            email,
            source || 'supabase_migration',
            is_active ?? true,
            subscribed_at || created_at || new Date().toISOString(),
            created_at || new Date().toISOString(),
          ]
        );
        stats.inserted++;
      } else {
        // Existing — only update is_active if Supabase says active and local says inactive
        // (never clobber a local unsubscribe)
        const localActive = existing.rows[0].is_active;
        const remoteActive = is_active ?? true;

        if (remoteActive && !localActive) {
          // Re-activate only if explicitly active in Supabase
          await client.query(
            `UPDATE newsletter_subscribers
             SET is_active = true, updated_at = NOW()
             WHERE email = $1`,
            [email]
          );
          stats.updated++;
        }
        // else: leave local state as-is
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return stats;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════════════════');
  log('  Newsletter Migration: Supabase → PostgreSQL');
  if (DRY_RUN) log('  ⚠️   DRY RUN — no data will be written');
  log('═══════════════════════════════════════════════════════\n');

  try {
    const rows = await fetchAllFromSupabase();

    if (rows.length === 0) {
      log('ℹ️   No newsletter subscribers found in Supabase. Nothing to migrate.');
      return;
    }

    // Preview sample
    log(`📋  Sample (first 5):`);
    rows.slice(0, 5).forEach(r => log(`    ${r.email}  active=${r.is_active}  source=${r.source}`));
    if (rows.length > 5) log(`    ... and ${rows.length - 5} more\n`);

    const stats = await upsertSubscribers(rows);

    log('\n─── Results ───────────────────────────────────────────');
    log(`  Total from Supabase : ${rows.length}`);
    if (DRY_RUN) {
      log(`  Would insert/update : ${stats.inserted}`);
      log('\n  Run without --dry-run to apply changes.');
    } else {
      log(`  Newly inserted      : ${stats.inserted}`);
      log(`  Re-activated        : ${stats.updated}`);
      log(`  Skipped (no change) : ${rows.length - stats.inserted - stats.updated}`);
    }
    log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    elog('\n❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await localPool.end();
  }
}

main();
