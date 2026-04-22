'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Force-replace the migrations list with a deterministic fixture so the
// test doesn't drag in the real schema (which needs a real Postgres).
const Module = require('module');
const originalResolve = Module._resolve_filename ? Module._resolve_filename.bind(Module) : null;

const migrationsPath = require.resolve('../src/core/migrations');
const fakeMigrations = [
  { id: '001_a', up: async (c) => { await c.query('CREATE TABLE foo (id INT)'); } },
  { id: '002_b', up: async (c) => { await c.query('CREATE TABLE bar (id INT)'); } }
];
require.cache[migrationsPath] = { id: migrationsPath, filename: migrationsPath, loaded: true, exports: fakeMigrations };

const migrator = require('../src/core/migrator');

/** Mock pool that records every query and simulates applied state. */
function makeMockPool() {
  const queries = [];
  const appliedIds = new Set();
  const client = {
    async query(text, params) {
      queries.push({ text: typeof text === 'string' ? text.trim() : text, params });
      const t = typeof text === 'string' ? text.trim() : '';
      if (/^SELECT id FROM _migrations/i.test(t)) {
        return { rows: [...appliedIds].map((id) => ({ id })) };
      }
      if (/^INSERT INTO _migrations/i.test(t)) {
        appliedIds.add(params[0]);
        return { rows: [] };
      }
      if (/advisory/i.test(t)) return { rows: [] };
      if (/^BEGIN|^COMMIT|^ROLLBACK/i.test(t)) return { rows: [] };
      if (/^CREATE TABLE IF NOT EXISTS _migrations/i.test(t)) return { rows: [] };
      return { rows: [] };
    },
    release() {}
  };
  return {
    async connect() { return client; },
    _queries: queries,
    _applied: appliedIds
  };
}

test('runPending applies all pending migrations in order', async () => {
  const pool = makeMockPool();
  const result = await migrator.runPending(pool);
  assert.deepEqual(result.applied, ['001_a', '002_b']);
  assert.deepEqual(result.alreadyApplied, []);

  const creates = pool._queries.filter((q) => /^CREATE TABLE foo|^CREATE TABLE bar/.test(q.text));
  assert.equal(creates.length, 2);
  assert.match(creates[0].text, /foo/);
  assert.match(creates[1].text, /bar/);
});

test('runPending is a no-op when all migrations already applied', async () => {
  const pool = makeMockPool();
  pool._applied.add('001_a');
  pool._applied.add('002_b');

  const result = await migrator.runPending(pool);
  assert.deepEqual(result.applied, []);
  assert.deepEqual(result.alreadyApplied, ['001_a', '002_b']);

  const creates = pool._queries.filter((q) => /^CREATE TABLE foo|^CREATE TABLE bar/.test(q.text));
  assert.equal(creates.length, 0);
});

test('runPending skips only applied migrations and applies the rest', async () => {
  const pool = makeMockPool();
  pool._applied.add('001_a');

  const result = await migrator.runPending(pool);
  assert.deepEqual(result.applied, ['002_b']);
  assert.deepEqual(result.alreadyApplied, ['001_a']);
});

test('runPending rolls back a failing migration and does not mark it applied', async () => {
  // Inject a failing migration. The migrator captures the list at
  // module-load, so we have to swap the cache AND re-require the migrator
  // to pick up the new list.
  require.cache[migrationsPath].exports = [
    { id: '001_ok', up: async (c) => { await c.query('CREATE TABLE ok (id INT)'); } },
    { id: '002_bad', up: async () => { throw new Error('boom'); } }
  ];
  delete require.cache[require.resolve('../src/core/migrator')];
  const freshMigrator = require('../src/core/migrator');

  const pool = makeMockPool();
  await assert.rejects(() => freshMigrator.runPending(pool), /boom/);

  assert.deepEqual([...pool._applied], ['001_ok']);

  const rollbacks = pool._queries.filter((q) => /^ROLLBACK/i.test(q.text));
  assert.equal(rollbacks.length, 1);

  // Restore fixture + fresh migrator for any later tests in this file.
  require.cache[migrationsPath].exports = fakeMigrations;
  delete require.cache[require.resolve('../src/core/migrator')];
});

test('runPending wraps the run in an advisory lock', async () => {
  const pool = makeMockPool();
  await migrator.runPending(pool);
  const locks = pool._queries.filter((q) => /pg_advisory_lock/i.test(q.text));
  const unlocks = pool._queries.filter((q) => /pg_advisory_unlock/i.test(q.text));
  assert.equal(locks.length, 1);
  assert.equal(unlocks.length, 1);
});
