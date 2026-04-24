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

// Each task has a WHERE clause (used by both the COUNT preview and the
// DELETE) so dry-run and real-run stay in sync. The DELETE uses IN (SELECT
// … LIMIT) so Postgres caps a single invocation at BATCH_LIMIT rows.
const TASKS = [
  {
    name: 'idempotency_keys',
    table: 'idempotency_keys',
    idCol: 'id',
    where: 'expires_at < NOW()'
  },
  {
    name: 'password_resets',
    table: 'password_resets',
    idCol: 'id',
    where: `(used_at IS NOT NULL OR expires_at < NOW())
            AND created_at < NOW() - INTERVAL '30 days'`
  },
  {
    name: 'audit_logs',
    table: 'audit_logs',
    idCol: 'id',
    // AUDIT_RETENTION_DAYS is inlined — Postgres can't parameterize the
    // units of INTERVAL. parseInt-validated at module load so there's no
    // injection risk.
    where: `created_at < NOW() - INTERVAL '${AUDIT_RETENTION_DAYS} days'`
  },
  {
    name: 'totp_setups',
    table: 'totp_setups',
    idCol: 'user_id',
    where: 'expires_at < NOW()'
  },
  {
    name: 'billing_intents',
    table: 'billing_intents',
    idCol: 'id',
    where: `status != 'paid' AND expires_at < NOW() - INTERVAL '7 days'`
  }
];

function deleteSql(task) {
  return `DELETE FROM ${task.table}
          WHERE ${task.idCol} IN (
            SELECT ${task.idCol} FROM ${task.table} WHERE ${task.where} LIMIT $1
          )`;
}

function countSql(task) {
  return `SELECT COUNT(*)::int AS n FROM ${task.table} WHERE ${task.where}`;
}

async function runCleanup(pool, { dryRun = false } = {}) {
  const started = Date.now();
  const results = [];
  for (const task of TASKS) {
    try {
      if (dryRun) {
        const res = await pool.query(countSql(task));
        results.push({ name: task.name, wouldDelete: Number(res.rows[0].n), ok: true });
      } else {
        const res = await pool.query(deleteSql(task), [BATCH_LIMIT]);
        results.push({ name: task.name, deleted: res.rowCount, ok: true });
      }
    } catch (err) {
      logger.warn(`cleanup task ${task.name} failed`, err && err.message);
      results.push({ name: task.name, ok: false, error: err && err.message });
    }
  }
  const duration_ms = Date.now() - started;
  const total = results.reduce(
    (n, r) => n + (r.deleted || r.wouldDelete || 0),
    0
  );
  const label = dryRun ? 'cleanup dry-run complete' : 'cleanup complete';
  logger.info(label, { duration_ms, total, results });
  return {
    duration_ms,
    dryRun,
    totalDeleted: dryRun ? 0 : total,
    totalWouldDelete: dryRun ? total : undefined,
    results
  };
}

module.exports = { runCleanup };
