'use strict';

/**
 * Retention sweeper. Deletes rows that have aged past their useful life:
 *
 *   - idempotency_keys  → expires_at < now() (served their 24h purpose)
 *   - password_resets   → used or expired AND created > 30 days ago
 *   - audit_logs        → created > AUDIT_RETENTION_DAYS (default 365)
 *   - totp_setups       → expires_at < now() (unconfirmed 15-min flows)
 *   - billing_intents   → status != 'paid' AND expires_at < now() - 7 days
 *                         (paid ones stay; they're part of the money trail)
 *
 * Safe to run concurrently — every query is idempotent and uses a LIMIT
 * so a single call never hogs the DB. The endpoint that triggers this
 * (and the npm script) is tolerant to partial success: if one table
 * errors, the others still run.
 *
 * Wire up via Vercel cron: add `{ "crons": [{ "path": "/api/_cleanup?token=$CLEANUP_TOKEN", "schedule": "0 3 * * *" }] }`
 * to vercel.json, or hit the endpoint from any external scheduler.
 */

const logger = require('./logger');

const BATCH_LIMIT = parseInt(process.env.CLEANUP_BATCH_LIMIT || '10000', 10);
const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10);

const TASKS = [
  {
    name: 'idempotency_keys',
    sql: `DELETE FROM idempotency_keys
          WHERE id IN (
            SELECT id FROM idempotency_keys WHERE expires_at < NOW() LIMIT $1
          )`
  },
  {
    name: 'password_resets',
    sql: `DELETE FROM password_resets
          WHERE id IN (
            SELECT id FROM password_resets
            WHERE (used_at IS NOT NULL OR expires_at < NOW())
              AND created_at < NOW() - INTERVAL '30 days'
            LIMIT $1
          )`
  },
  {
    name: 'audit_logs',
    // AUDIT_RETENTION_DAYS is inlined because Postgres can't parameterize
    // the units of an INTERVAL literal. The value is parseInt-validated
    // at module load so there's no injection risk.
    sql: `DELETE FROM audit_logs
          WHERE id IN (
            SELECT id FROM audit_logs
            WHERE created_at < NOW() - INTERVAL '${AUDIT_RETENTION_DAYS} days'
            LIMIT $1
          )`
  },
  {
    name: 'totp_setups',
    sql: `DELETE FROM totp_setups
          WHERE user_id IN (
            SELECT user_id FROM totp_setups WHERE expires_at < NOW() LIMIT $1
          )`
  },
  {
    name: 'billing_intents',
    sql: `DELETE FROM billing_intents
          WHERE id IN (
            SELECT id FROM billing_intents
            WHERE status != 'paid' AND expires_at < NOW() - INTERVAL '7 days'
            LIMIT $1
          )`
  }
];

async function runCleanup(pool) {
  const started = Date.now();
  const results = [];
  for (const task of TASKS) {
    try {
      const res = await pool.query(task.sql, [BATCH_LIMIT]);
      results.push({ name: task.name, deleted: res.rowCount, ok: true });
    } catch (err) {
      logger.warn(`cleanup task ${task.name} failed`, err && err.message);
      results.push({ name: task.name, ok: false, error: err && err.message });
    }
  }
  const duration_ms = Date.now() - started;
  const totalDeleted = results.reduce((n, r) => n + (r.deleted || 0), 0);
  logger.info('cleanup complete', { duration_ms, totalDeleted, results });
  return { duration_ms, totalDeleted, results };
}

module.exports = { runCleanup };
