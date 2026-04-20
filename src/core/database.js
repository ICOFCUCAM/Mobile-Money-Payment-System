'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config');
const logger = require('./logger');

let db;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS schools (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT,
  api_key_hash      TEXT NOT NULL,
  api_key_prefix    TEXT NOT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'basic',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  subscription_expires_at TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL CHECK (role IN ('admin','bursar','auditor')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE(school_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

CREATE TABLE IF NOT EXISTS students (
  id            TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL,
  student_code  TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  class_name    TEXT,
  phone         TEXT,
  balance       INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'XAF',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE(school_id, student_code)
);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);

CREATE TABLE IF NOT EXISTS payment_configs (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL,
  provider   TEXT NOT NULL,
  api_key    TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  base_url   TEXT,
  metadata   TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE(school_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_payment_configs_school ON payment_configs(school_id);

CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  school_id       TEXT NOT NULL,
  student_id      TEXT,
  provider        TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XAF',
  status          TEXT NOT NULL CHECK (status IN ('pending','success','failed','reversed')),
  phone           TEXT,
  raw_response    TEXT,
  verified_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  UNIQUE(school_id, provider, external_id)
);
CREATE INDEX IF NOT EXISTS idx_tx_school ON transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_tx_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);

CREATE TABLE IF NOT EXISTS subscriptions (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL,
  plan       TEXT NOT NULL,
  status     TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  amount     INTEGER,
  currency   TEXT DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sub_school ON subscriptions(school_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  TEXT,
  user_id    TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  metadata   TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`;

function initDatabase() {
  if (db) return db;
  const dbPath = config.database.url;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  logger.info(`Database initialized at ${dbPath}`);
  return db;
}

function getDb() {
  if (!db) return initDatabase();
  return db;
}

function writeAudit({ schoolId, userId, action, entity, entityId, metadata, ip }) {
  try {
    getDb()
      .prepare(
        `INSERT INTO audit_logs (school_id, user_id, action, entity, entity_id, metadata, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        schoolId || null,
        userId || null,
        action,
        entity || null,
        entityId || null,
        metadata ? JSON.stringify(metadata) : null,
        ip || null
      );
  } catch (err) {
    logger.warn('Failed to write audit log', err);
  }
}

module.exports = { initDatabase, getDb, writeAudit };
