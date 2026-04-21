'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
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

  const existing = await db.query(
    'SELECT id FROM schools WHERE slug = $1 OR email = $2',
    [payload.slug, payload.email.toLowerCase()]
  );
  if (existing.rows.length) throw new ConflictError('School with that slug or email already exists');

  const schoolId = uuid();
  const userId = uuid();
  const apiKey = generateApiKey();
  const passwordHash = await bcrypt.hash(payload.password, config.security.bcryptRounds);

  await db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO schools (id, name, slug, email, phone, api_key_hash, api_key_prefix, subscription_plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        schoolId,
        payload.name,
        payload.slug.toLowerCase(),
        payload.email.toLowerCase(),
        payload.phone || null,
        apiKey.hash,
        apiKey.prefix,
        plan
      ]
    );
    await client.query(
      `INSERT INTO users (id, school_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')`,
      [userId, schoolId, payload.email.toLowerCase(), passwordHash, payload.adminName]
    );
    await client.query(
      `INSERT INTO subscriptions (id, school_id, plan, status) VALUES ($1, $2, $3, 'active')`,
      [uuid(), schoolId, plan]
    );
  });

  writeAudit({ schoolId, userId, action: 'school.register', entity: 'school', entityId: schoolId, ip });

  return { school: await getSchool(schoolId), apiKey: apiKey.raw };
}

async function getSchool(id) {
  const res = await db.query('SELECT * FROM schools WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row) throw new NotFoundError('School not found');
  return sanitize(row);
}

async function updateSchool(id, patch, actor) {
  const allowed = ['name', 'phone', 'is_active'];
  const fields = [];
  const values = [];
  let i = 1;
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = $${i++}`);
      values.push(patch[k]);
    }
  }
  if (!fields.length) throw new ValidationError('No updatable fields supplied');
  values.push(id);
  await db.query(`UPDATE schools SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
  writeAudit({ schoolId: id, userId: actor && actor.id, action: 'school.update', entity: 'school', entityId: id, metadata: patch });
  return getSchool(id);
}

/** Rotate the school's API key. Returns the new plaintext key once. */
async function rotateApiKey(schoolId, actor) {
  const key = generateApiKey();
  await db.query(
    'UPDATE schools SET api_key_hash = $1, api_key_prefix = $2, updated_at = NOW() WHERE id = $3',
    [key.hash, key.prefix, schoolId]
  );
  writeAudit({ schoolId, userId: actor && actor.id, action: 'school.rotate_api_key', entity: 'school', entityId: schoolId });
  return key.raw;
}

// ---------- Payment config management ----------

async function upsertPaymentConfig(schoolId, payload, actor) {
  requireFields(payload, ['provider', 'api_key', 'api_secret']);
  const providerId = String(payload.provider).toUpperCase();
  if (!REGISTRY[providerId]) throw new ValidationError(`Unsupported provider: ${providerId}`);

  const record = {
    api_key: encrypt(payload.api_key),
    api_secret: encrypt(payload.api_secret),
    base_url: payload.base_url || null,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    is_active: payload.is_active === false ? false : true
  };

  await db.query(
    `INSERT INTO payment_configs (id, school_id, provider, api_key, api_secret, base_url, metadata, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (school_id, provider) DO UPDATE
       SET api_key = EXCLUDED.api_key,
           api_secret = EXCLUDED.api_secret,
           base_url = EXCLUDED.base_url,
           metadata = EXCLUDED.metadata,
           is_active = EXCLUDED.is_active,
           updated_at = NOW()`,
    [uuid(), schoolId, providerId, record.api_key, record.api_secret, record.base_url, record.metadata, record.is_active]
  );

  writeAudit({
    schoolId,
    userId: actor && actor.id,
    action: 'payment_config.upsert',
    entity: 'payment_config',
    entityId: providerId
  });
  return listPaymentConfigs(schoolId);
}

async function listPaymentConfigs(schoolId) {
  const res = await db.query(
    'SELECT id, provider, base_url, is_active, api_key, created_at, updated_at FROM payment_configs WHERE school_id = $1',
    [schoolId]
  );
  return res.rows.map((r) => ({
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

async function deleteSchool(schoolId, actor, ip) {
  const res = await db.query('DELETE FROM schools WHERE id = $1', [schoolId]);
  if (!res.rowCount) throw new NotFoundError('School not found');
  writeAudit({ schoolId, userId: actor && actor.id, action: 'school.delete', entity: 'school', entityId: schoolId, ip });
}

module.exports = {
  registerSchool,
  getSchool,
  updateSchool,
  rotateApiKey,
  deleteSchool,
  upsertPaymentConfig,
  listPaymentConfigs
};
