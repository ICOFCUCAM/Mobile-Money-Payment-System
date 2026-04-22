#!/usr/bin/env node
'use strict';

/**
 * Migration CLI.
 *
 *   node scripts/migrate.js          # apply any pending migrations
 *   node scripts/migrate.js status   # show applied / pending without running
 *
 * Exit code is non-zero on failure so CI / pre-deploy scripts can gate on it.
 * DATABASE_URL must be set in the environment.
 */

const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (_) {}

const migrator = require('../src/core/migrator');
const { getPool } = require('../src/core/database');

async function main() {
  const cmd = process.argv[2] || 'up';
  const pool = getPool();

  if (cmd === 'status') {
    const rows = await migrator.status(pool);
    for (const r of rows) {
      const marker = r.applied ? '✓' : '·';
      console.log(`${marker} ${r.id}`);
    }
    const pending = rows.filter((r) => !r.applied).length;
    console.log(`\n${rows.length - pending} applied, ${pending} pending`);
    return;
  }

  if (cmd === 'up') {
    const { applied, alreadyApplied } = await migrator.runPending(pool);
    if (applied.length === 0) {
      console.log(`up-to-date (${alreadyApplied.length} migrations already applied)`);
    } else {
      console.log(`applied ${applied.length} migration(s):`);
      for (const id of applied) console.log(`  + ${id}`);
    }
    return;
  }

  console.error(`Unknown command: ${cmd}\nUsage: migrate [up|status]`);
  process.exit(2);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('migration failed:', err && (err.stack || err.message) || err);
    process.exit(1);
  });
