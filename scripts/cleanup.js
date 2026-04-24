#!/usr/bin/env node
'use strict';

/**
 * Manual / CI cleanup runner.
 *
 *   node scripts/cleanup.js
 *
 * Same logic as the /api/_cleanup endpoint, intended for one-off runs or
 * CI invocations. DATABASE_URL must be set. Exit code is non-zero if any
 * task errored so CI can gate on it.
 */

const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (_) {}

const { runCleanup } = require('../src/core/cleanup');
const { getPool } = require('../src/core/database');

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  const pool = getPool();
  const summary = await runCleanup(pool, { dryRun });

  const total = dryRun ? summary.totalWouldDelete : summary.totalDeleted;
  const verb  = dryRun ? 'would delete' : 'deleted';
  console.log(`cleanup finished in ${summary.duration_ms}ms — ${total} rows ${verb}`);
  for (const r of summary.results) {
    const n = r.deleted ?? r.wouldDelete ?? 0;
    if (r.ok) console.log(`  ${dryRun ? '·' : '✓'} ${r.name.padEnd(20)} ${n}`);
    else      console.log(`  ✗ ${r.name.padEnd(20)} ${r.error}`);
  }

  const anyFailed = summary.results.some((r) => !r.ok);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('cleanup threw:', err && (err.stack || err.message) || err);
  process.exit(1);
});
