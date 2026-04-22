'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('./logger');
const migrator = require('./migrator');

let pool;
let schemaReady = false;
let schemaPromise;

function buildPool() {
  const connectionString = config.database.url;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  // Parse the URL ourselves so we can set TLS options explicitly.
  // Passing a `connectionString` to pg can let URL params (like sslmode=require)
  // override the ssl option at connect time, which breaks hosts using self-signed
  // cert chains (Supabase, Neon pooler).
  const url = new URL(connectionString);
  const sslDisabled = /sslmode=disable/.test(connectionString);
  const ssl = sslDisabled ? false : { rejectUnauthorized: false };

  return new Pool({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl,
    max: parseInt(process.env.DATABASE_POOL_MAX || (config.isProd ? '5' : '10'), 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
}

function getPool() {
  if (!pool) pool = buildPool();
  return pool;
}

/**
 * Ensure the schema is at the latest version by applying any pending
 * migrations. Safe to call on every cold start — the migrator is idempotent
 * (consults a _migrations table) and serialises concurrent callers via a
 * Postgres advisory lock.
 *
 * If migrations fail, this function caches the failure for this process only
 * (by clearing schemaPromise) so the next request can retry. We never want
 * a transient DB blip to turn a deploy into a permanent outage.
 */
async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const { applied, alreadyApplied } = await migrator.runPending(getPool());
    schemaReady = true;
    if (applied.length) {
      logger.info(`migrations applied: ${applied.join(', ')}`);
    } else {
      logger.info(`migrations up-to-date (${alreadyApplied.length} already applied)`);
    }
  })().catch((err) => {
    schemaPromise = null;
    logger.error('ensureSchema fatal', err);
    throw err;
  });

  return schemaPromise;
}

async function initDatabase() {
  getPool();
  await ensureSchema();
}

const db = {
  async query(text, params) {
    await ensureSchema();
    return getPool().query(text, params);
  },
  /**
   * Runs `fn(client)` inside a transaction with automatic BEGIN/COMMIT/ROLLBACK.
   */
  async withTransaction(fn) {
    await ensureSchema();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      client.release();
    }
  }
};

/**
 * Fire-and-forget audit logger. Never throws — failing to audit must not break the user action.
 */
function writeAudit({ schoolId, userId, action, entity, entityId, metadata, ip }) {
  const sql = `INSERT INTO audit_logs (school_id, user_id, action, entity, entity_id, metadata, ip)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`;
  const args = [
    schoolId || null,
    userId || null,
    action,
    entity || null,
    entityId || null,
    metadata ? JSON.stringify(metadata) : null,
    ip || null
  ];
  db.query(sql, args).catch((err) => logger.warn('Failed to write audit log', err.message));
}

module.exports = { initDatabase, ensureSchema, getPool, db, writeAudit };
