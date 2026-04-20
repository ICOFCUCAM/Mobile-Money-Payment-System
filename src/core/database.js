'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('./logger');

let pool;
let schemaReady = false;
let schemaPromise;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS schools (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  email                   TEXT NOT NULL UNIQUE,
  phone                   TEXT,
  api_key_hash            TEXT NOT NULL,
  api_key_prefix          TEXT NOT NULL,
  subscription_plan       TEXT NOT NULL DEFAULT 'basic',
  subscription_status     TEXT NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_api_key_hash ON schools(api_key_hash);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL CHECK (role IN ('admin','bursar','auditor')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

CREATE TABLE IF NOT EXISTS students (
  id           TEXT PRIMARY KEY,
  school_id    TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  class_name   TEXT,
  phone        TEXT,
  balance      BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'XAF',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, student_code)
);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(school_id, phone);

CREATE TABLE IF NOT EXISTS payment_configs (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL,
  api_key    TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  base_url   TEXT,
  metadata   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_payment_configs_school ON payment_configs(school_id);

CREATE TABLE IF NOT EXISTS transactions (
  id           TEXT PRIMARY KEY,
  school_id    TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id   TEXT REFERENCES students(id) ON DELETE SET NULL,
  provider     TEXT NOT NULL,
  external_id  TEXT NOT NULL,
  amount       BIGINT NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'XAF',
  status       TEXT NOT NULL CHECK (status IN ('pending','success','failed','reversed')),
  phone        TEXT,
  raw_response TEXT,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, provider, external_id)
);
CREATE INDEX IF NOT EXISTS idx_tx_school ON transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_tx_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(school_id, status);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(school_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL,
  status     TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  amount     INTEGER,
  currency   TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_school ON subscriptions(school_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  school_id  TEXT,
  user_id    TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  metadata   TEXT,
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
`;

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
 * Ensure the schema exists. Safe to call on every cold start — `CREATE TABLE IF NOT EXISTS`
 * makes it idempotent. Serverless functions call this lazily.
 */
async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = getPool()
    .query(SCHEMA)
    .then(() => {
      schemaReady = true;
      logger.info('Postgres schema ensured');
    })
    .catch((err) => {
      schemaPromise = null;
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
