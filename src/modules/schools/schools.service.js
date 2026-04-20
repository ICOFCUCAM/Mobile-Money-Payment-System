'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb, writeAudit } = require('../../core/database');
const { encrypt } = require('../../core/encryption');
const { hashApiKey } = require('../../middleware/auth');
const { ConflictError, NotFoundError, ValidationError } = require('../../core/errors');
const { assertEmail, assertSlug, requireFields } = require('../../utils/validators');
const { getPlan } = require('../subscriptions/plans');
const config = require('../../config');
const { REGISTRY } = require('../../providers/ProviderFactory');

function generateApiKey() {
  const raw = `sk_${crypto.randomBytes(24).toString('hex')}`;
  return { raw, hash: hashApiKey(raw), prefix: raw.slice(0, 12) };
}

/**
 * Register a new tenant (school) + its first admin user.
 * Returns the plaintext API key once — the caller must persist it.
 */
async function registerSchool(payload, ip) {
  requireFields(payload, ['name', 'slug', 'email', 'password', 'adminName']);
  assertSlug(payload.slug);
  assertEmail(payload.email);
  if (payload.password.length < 8) throw new ValidationError('Password must be at least 8 characters');

  const plan = payload.plan && getPlan(payload.plan) ? payload.plan : 'basic';

  const db = getDb();
  const existing = db.prepare('SELECT id FROM schools WHERE slug = ? OR email = ?').get(payload.slug, payload.email);
  if (existing) throw new ConflictError('School with that slug or email already exists');

  const schoolId = uuid();
  const userId = uuid();
  const apiKey = generateApiKey();
  const passwordHash = await bcrypt.hash(payload.password, config.security.bcryptRounds);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO schools (id, name, slug, email, phone, api_key_hash, api_key_prefix, subscription_plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      schoolId,
      payload.name,
      payload.slug.toLowerCase(),
      payload.email.toLowerCase(),
      payload.phone || null,
      apiKey.hash,
      apiKey.prefix,
      plan
    );
    db.prepare(
      `INSERT INTO users (id, school_id, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?, 'admin')`
    ).run(userId, schoolId, payload.email.toLowerCase(), passwordHash, payload.adminName);

    db.prepare(
      `INSERT INTO subscriptions (id, school_id, plan, status) VALUES (?, ?, ?, 'active')`
    ).run(uuid(), schoolId, plan);
  });
  tx();

  writeAudit({ schoolId, userId, action: 'school.register', entity: 'school', entityId: schoolId, ip });

  return {
    school: getSchool(schoolId),
    apiKey: apiKey.raw
  };
}

function getSchool(id) {
  const row = getDb().prepare('SELECT * FROM schools WHERE id = ?').get(id);
  if (!row) throw new NotFoundError('School not found');
  return sanitize(row);
}

function updateSchool(id, patch, actor) {
  const db = getDb();
  const allowed = ['name', 'phone', 'is_active'];
  const fields = [];
  const values = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (!fields.length) throw new ValidationError('No updatable fields supplied');
  values.push(id);
  db.prepare(`UPDATE schools SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
  writeAudit({ schoolId: id, userId: actor && actor.id, action: 'school.update', entity: 'school', entityId: id, metadata: patch });
  return getSchool(id);
}

/** Rotate the school's API key. Returns the new plaintext key once. */
function rotateApiKey(schoolId, actor) {
  const key = generateApiKey();
  getDb()
    .prepare('UPDATE schools SET api_key_hash = ?, api_key_prefix = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(key.hash, key.prefix, schoolId);
  writeAudit({ schoolId, userId: actor && actor.id, action: 'school.rotate_api_key', entity: 'school', entityId: schoolId });
  return key.raw;
}

// ---------- Payment config management ----------

function upsertPaymentConfig(schoolId, payload, actor) {
  requireFields(payload, ['provider', 'api_key', 'api_secret']);
  const providerId = String(payload.provider).toUpperCase();
  if (!REGISTRY[providerId]) throw new ValidationError(`Unsupported provider: ${providerId}`);

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM payment_configs WHERE school_id = ? AND provider = ?')
    .get(schoolId, providerId);

  const record = {
    api_key: encrypt(payload.api_key),
    api_secret: encrypt(payload.api_secret),
    base_url: payload.base_url || null,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    is_active: payload.is_active === false ? 0 : 1
  };

  if (existing) {
    db.prepare(
      `UPDATE payment_configs
         SET api_key = ?, api_secret = ?, base_url = ?, metadata = ?, is_active = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(record.api_key, record.api_secret, record.base_url, record.metadata, record.is_active, existing.id);
  } else {
    db.prepare(
      `INSERT INTO payment_configs (id, school_id, provider, api_key, api_secret, base_url, metadata, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuid(), schoolId, providerId, record.api_key, record.api_secret, record.base_url, record.metadata, record.is_active);
  }

  writeAudit({
    schoolId,
    userId: actor && actor.id,
    action: 'payment_config.upsert',
    entity: 'payment_config',
    entityId: providerId
  });
  return listPaymentConfigs(schoolId);
}

function listPaymentConfigs(schoolId) {
  return getDb()
    .prepare('SELECT id, provider, base_url, is_active, api_key, created_at, updated_at FROM payment_configs WHERE school_id = ?')
    .all(schoolId)
    .map((r) => ({
      id: r.id,
      provider: r.provider,
      base_url: r.base_url,
      is_active: !!r.is_active,
      has_credentials: !!r.api_key,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
}

function sanitize(school) {
  const { api_key_hash, ...rest } = school;
  return { ...rest, is_active: !!school.is_active };
}

module.exports = {
  registerSchool,
  getSchool,
  updateSchool,
  rotateApiKey,
  upsertPaymentConfig,
  listPaymentConfigs
};
