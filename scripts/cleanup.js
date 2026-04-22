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
  const pool = getPool();
  const { duration_ms, totalDeleted, results } = await runCleanup(pool);

  console.log(`cleanup finished in ${duration_ms}ms — ${totalDeleted} rows deleted`);
  for (const r of results) {
    if (r.ok) console.log(`  ✓ ${r.name.padEnd(20)} ${r.deleted}`);
    else      console.log(`  ✗ ${r.name.padEnd(20)} ${r.error}`);
  }

  const anyFailed = results.some((r) => !r.ok);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('cleanup threw:', err && (err.stack || err.message) || err);
  process.exit(1);
});
