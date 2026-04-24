'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateEnv } = require('../src/core/validateEnv');

const silentLogger = { warn: () => {}, error: () => {} };

function withEnv(vars, fn) {
  const snapshot = { ...process.env };
  Object.assign(process.env, vars);
  for (const [k, v] of Object.entries(vars)) if (v === undefined) delete process.env[k];
  try { return fn(); } finally {
    for (const k of Object.keys(process.env)) if (!(k in snapshot)) delete process.env[k];
    Object.assign(process.env, snapshot);
  }
}

/** Collect hard errors in a never-throw mode so we can assert content. */
function audit(vars) {
  return withEnv(vars, () => validateEnv({ throwOnError: false, logger: silentLogger }));
}

test('dev mode: missing critical vars produce warnings, not errors', () => {
  const { hardErrors, warnings } = audit({
    NODE_ENV: 'development',
    DATABASE_URL: undefined, JWT_SECRET: undefined, ENCRYPTION_KEY: undefined
  });
  assert.equal(hardErrors.length, 0);
  assert.ok(warnings.some((w) => w.includes('DATABASE_URL')));
  assert.ok(warnings.some((w) => w.includes('JWT_SECRET')));
  assert.ok(warnings.some((w) => w.includes('ENCRYPTION_KEY')));
});

test('prod mode: missing critical var throws', () => {
  withEnv({
    NODE_ENV: 'production', DATABASE_URL: undefined,
    JWT_SECRET: 'realsecret', ENCRYPTION_KEY: 'a'.repeat(64)  // 64 hex chars → 32 bytes
  }, () => {
    assert.throws(() => validateEnv({ logger: silentLogger }), /Environment validation failed/);
  });
});

test('prod mode: dev-default JWT_SECRET shows up as a hard error', () => {
  const { hardErrors } = audit({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    JWT_SECRET: 'dev_only_jwt_secret_change_me_in_production',
    ENCRYPTION_KEY: 'a'.repeat(64)  // 64 hex chars → 32 bytes
  });
  assert.ok(hardErrors.some((e) => /JWT_SECRET.*development default/.test(e)));
});

test('prod mode: dev-default ENCRYPTION_KEY shows up as a hard error', () => {
  const { hardErrors } = audit({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    JWT_SECRET: 'realsecret',
    ENCRYPTION_KEY: 'dev_only_encryption_key_change_me_in_production_32b'
  });
  assert.ok(hardErrors.some((e) => /ENCRYPTION_KEY.*development default/.test(e)));
});

test('prod mode: encryption key of wrong length shows up as a hard error', () => {
  const { hardErrors } = audit({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    JWT_SECRET: 'realsecret',
    ENCRYPTION_KEY: 'tooshort'
  });
  assert.ok(hardErrors.some((e) => /ENCRYPTION_KEY decodes to \d+ bytes; AES-256 needs 32/.test(e)));
});

test('prod mode: valid config passes', () => {
  const { hardErrors } = audit({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    JWT_SECRET: 'realsecret',
    ENCRYPTION_KEY: 'a'.repeat(64)  // 64 hex chars → 32 bytes
  });
  assert.equal(hardErrors.length, 0);
});

test('throwOnError:false never throws even in prod', () => {
  const { hardErrors } = audit({ NODE_ENV: 'production', DATABASE_URL: undefined });
  assert.ok(hardErrors.length > 0);
});
