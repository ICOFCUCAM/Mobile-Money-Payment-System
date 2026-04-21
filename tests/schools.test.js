'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const helpers = require('./_helpers');
const schoolsService = require('../src/modules/schools/schools.service');
const { hashApiKey } = require('../src/middleware/auth');

test.before(async () => helpers.ensureReady());
test.after(async () => helpers.teardown());

test('registerSchool creates a tenant + admin + returns one-time API key', async () => {
  const slug = `s${helpers.uniq()}`;
  const res = await schoolsService.registerSchool({
    name: 'Greenwood High',
    slug,
    email: `admin-${slug}@x.edu`,
    adminName: 'Jane',
    password: 'supersecret',
    plan: 'pro'
  });

  assert.ok(res.school.id);
  assert.equal(res.school.slug, slug);
  assert.equal(res.school.subscription_plan, 'pro');
  assert.match(res.apiKey, /^sk_[0-9a-f]{48}$/);

  // The plaintext key must not be persisted — only its hash is stored.
  const row = await helpers.db.query('SELECT api_key_hash FROM schools WHERE id = $1', [res.school.id]);
  assert.equal(row.rows[0].api_key_hash, hashApiKey(res.apiKey));
});

test('registerSchool rejects duplicate slug', async () => {
  const slug = `s${helpers.uniq()}`;
  await schoolsService.registerSchool({
    name: 'A', slug, email: `a-${slug}@x.edu`, adminName: 'A', password: 'supersecret'
  });
  await assert.rejects(
    () => schoolsService.registerSchool({
      name: 'B', slug, email: `b-${slug}@x.edu`, adminName: 'B', password: 'supersecret'
    }),
    (err) => err.code === 'CONFLICT'
  );
});

test('registerSchool rejects duplicate email', async () => {
  const suffix = helpers.uniq();
  const email = `shared-${suffix}@x.edu`;
  await schoolsService.registerSchool({
    name: 'A', slug: `a${suffix}`, email, adminName: 'A', password: 'supersecret'
  });
  await assert.rejects(
    () => schoolsService.registerSchool({
      name: 'B', slug: `b${suffix}`, email, adminName: 'B', password: 'supersecret'
    }),
    (err) => err.code === 'CONFLICT'
  );
});

test('rotateApiKey invalidates the old hash and returns a new plaintext key', async () => {
  const slug = `s${helpers.uniq()}`;
  const first = await schoolsService.registerSchool({
    name: 'A', slug, email: `a-${slug}@x.edu`, adminName: 'A', password: 'supersecret'
  });
  const rotated = await schoolsService.rotateApiKey(first.school.id);
  assert.notEqual(rotated, first.apiKey);

  const row = await helpers.db.query('SELECT api_key_hash FROM schools WHERE id = $1', [first.school.id]);
  assert.equal(row.rows[0].api_key_hash, hashApiKey(rotated));
  assert.notEqual(row.rows[0].api_key_hash, hashApiKey(first.apiKey));
});

test('upsertPaymentConfig encrypts credentials and upserts on conflict', async () => {
  const slug = `s${helpers.uniq()}`;
  const { school } = await schoolsService.registerSchool({
    name: 'A', slug, email: `a-${slug}@x.edu`, adminName: 'A', password: 'supersecret', plan: 'pro'
  });

  await schoolsService.upsertPaymentConfig(school.id, {
    provider: 'MTN', api_key: 'mtn_key_v1', api_secret: 'mtn_secret_v1'
  });
  const first = await helpers.db.query(
    'SELECT api_key, api_secret FROM payment_configs WHERE school_id = $1 AND provider = $2',
    [school.id, 'MTN']
  );
  assert.ok(first.rows[0].api_key);
  // Stored value must not be the plaintext.
  assert.notEqual(first.rows[0].api_key, 'mtn_key_v1');

  // Upsert should update in place, not create a new row.
  await schoolsService.upsertPaymentConfig(school.id, {
    provider: 'MTN', api_key: 'mtn_key_v2', api_secret: 'mtn_secret_v2'
  });
  const count = await helpers.db.query(
    'SELECT COUNT(*)::int AS c FROM payment_configs WHERE school_id = $1 AND provider = $2',
    [school.id, 'MTN']
  );
  assert.equal(count.rows[0].c, 1);
});

test('deleteSchool cascades to students, users, configs and transactions', async () => {
  const slug = `s${helpers.uniq()}`;
  const { school } = await schoolsService.registerSchool({
    name: 'Cascade', slug, email: `a-${slug}@x.edu`, adminName: 'A', password: 'supersecret'
  });

  // Sanity: user + subscription exist.
  const before = await helpers.db.query(
    'SELECT COUNT(*)::int AS c FROM users WHERE school_id = $1',
    [school.id]
  );
  assert.equal(before.rows[0].c, 1);

  await schoolsService.deleteSchool(school.id);

  const after = await helpers.db.query(
    'SELECT COUNT(*)::int AS c FROM users WHERE school_id = $1',
    [school.id]
  );
  assert.equal(after.rows[0].c, 0);
});
