'use strict';

/**
 * In-process migration runner.
 *
 * Design:
 *   - Each migration is a JS module exporting { id, up(client) }.
 *   - An append-only _migrations table records what ran and when.
 *   - A Postgres advisory lock (pg_try_advisory_lock) guards the runner
 *     so concurrent serverless cold starts can't race. If another instance
 *     is already applying migrations, later callers wait via pg_advisory_lock
 *     and then re-check the table and find everything applied — safe.
 *   - Each migration runs inside a transaction. DDL in Postgres is
 *     transactional, so a partial failure rolls back cleanly and the
 *     _migrations row isn't inserted, ensuring retry next boot.
 *
 * Returns { applied: [ids], alreadyApplied: [ids] } for logging.
 */

const logger = require('./logger');
const migrations = require('./migrations');

// Stable app-wide advisory lock ID (fits in int8). Never change — that would
// undermine mutual exclusion across deploys.
const ADVISORY_LOCK_ID = '7238419230573004281';

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id       TEXT PRIMARY KEY,
      run_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      duration_ms INTEGER
    )
  `);
}

async function fetchApplied(client) {
  const res = await client.query('SELECT id FROM _migrations');
  return new Set(res.rows.map((r) => r.id));
}

async function runPending(pool) {
  // Single connection for the lock + the run. Advisory locks are
  // session-scoped; release happens automatically when the client goes
  // back to the pool at the end.
  const client = await pool.connect();
  const applied = [];
  const alreadyApplied = [];
  try {
    // Block until we hold the lock. Other cold-start instances will wait
    // here and then find nothing pending once they get through.
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);
    try {
      await ensureMigrationsTable(client);
      const have = await fetchApplied(client);

      for (const m of migrations) {
        if (!m || typeof m.id !== 'string' || typeof m.up !== 'function') {
          throw new Error('Invalid migration entry: expected { id, up(client) }');
        }
        if (have.has(m.id)) {
          alreadyApplied.push(m.id);
          continue;
        }
        const started = Date.now();
        await client.query('BEGIN');
        try {
          await m.up(client);
          const duration = Date.now() - started;
          await client.query(
            'INSERT INTO _migrations (id, duration_ms) VALUES ($1, $2)',
            [m.id, duration]
          );
          await client.query('COMMIT');
          logger.info(`migration applied: ${m.id} (${duration}ms)`);
          applied.push(m.id);
        } catch (err) {
          try { await client.query('ROLLBACK'); } catch (_) {}
          logger.error(`migration failed: ${m.id}`, err);
          throw err;
        }
      }
    } finally {
      try { await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]); } catch (_) {}
    }
  } finally {
    client.release();
  }
  return { applied, alreadyApplied };
}

async function status(pool) {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const have = await fetchApplied(client);
    return migrations.map((m) => ({ id: m.id, applied: have.has(m.id) }));
  } finally {
    client.release();
  }
}

module.exports = { runPending, status };
