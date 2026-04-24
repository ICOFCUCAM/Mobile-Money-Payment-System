'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runCleanup } = require('../src/core/cleanup');

/** Mock pool that records queries and returns fake rowCount. */
function makePool(fakeCounts = {}) {
  const queries = [];
  return {
    _queries: queries,
    async query(sql, params) {
      queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      const match = Object.keys(fakeCounts).find((name) =>
        sql.includes(`DELETE FROM ${name}`)
      );
      return { rowCount: match ? fakeCounts[match] : 0, rows: [] };
    }
  };
}

test('runCleanup runs one DELETE per retention target', async () => {
  const pool = makePool({
    idempotency_keys: 5,
    password_resets: 2,
    audit_logs: 100,
    totp_setups: 1,
    billing_intents: 3
  });
  const result = await runCleanup(pool);

  assert.equal(pool._queries.length, 5);
  assert.equal(result.totalDeleted, 5 + 2 + 100 + 1 + 3);
  assert.deepEqual(
    result.results.map((r) => r.name),
    ['idempotency_keys', 'password_resets', 'audit_logs', 'totp_setups', 'billing_intents']
  );
  for (const r of result.results) assert.equal(r.ok, true);
});

test('runCleanup passes BATCH_LIMIT as $1', async () => {
  const pool = makePool();
  await runCleanup(pool);
  for (const q of pool._queries) {
    assert.ok(Array.isArray(q.params));
    assert.equal(typeof q.params[0], 'number');
    assert.ok(q.params[0] > 0);
  }
});

test('runCleanup survives a single task failing', async () => {
  const pool = makePool();
  // Override query to throw for audit_logs only.
  const original = pool.query.bind(pool);
  pool.query = async (sql, params) => {
    if (sql.includes('DELETE FROM audit_logs')) throw new Error('simulated');
    return original(sql, params);
  };

  const result = await runCleanup(pool);
  const audit = result.results.find((r) => r.name === 'audit_logs');
  assert.equal(audit.ok, false);
  assert.match(audit.error, /simulated/);

  // Others should still have run.
  const others = result.results.filter((r) => r.name !== 'audit_logs');
  assert.equal(others.length, 4);
  for (const r of others) assert.equal(r.ok, true);
});

test('runCleanup SQL never deletes without a LIMIT', async () => {
  const pool = makePool();
  await runCleanup(pool);
  for (const q of pool._queries) {
    assert.match(q.sql, /LIMIT \$1/, `query missing LIMIT: ${q.sql}`);
  }
});

test('runCleanup dry-run issues COUNT queries, not DELETEs', async () => {
  // Mock pool returns a fixed count per task.
  const pool = {
    _queries: [],
    async query(sql) {
      this._queries.push({ sql: sql.replace(/\s+/g, ' ').trim() });
      if (/^DELETE /.test(sql)) throw new Error('dry-run should not DELETE');
      // Fake COUNT for every table the dry-run probes.
      return { rows: [{ n: 7 }] };
    }
  };

  const result = await runCleanup(pool, { dryRun: true });
  assert.equal(result.dryRun, true);
  assert.equal(result.totalDeleted, 0);
  assert.equal(result.totalWouldDelete, 7 * 5);
  // All queries are SELECT COUNTs — never DELETE.
  for (const q of pool._queries) {
    assert.match(q.sql, /^SELECT COUNT/);
  }
});
