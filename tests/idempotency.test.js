'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Swap ../src/core/database with a mock BEFORE requiring the middleware.
// The middleware reads `db` at module load, so the cache swap must happen
// before the first require.
const dbModulePath = require.resolve('../src/core/database');
const mockDb = {
  _rows: new Map(),            // "scope|key" → stored row
  _queries: [],
  async query(text, params) {
    this._queries.push({ text: text.replace(/\s+/g, ' ').trim(), params });

    // INSERT claim: ON CONFLICT DO NOTHING RETURNING id
    if (/INSERT INTO idempotency_keys/i.test(text) && /ON CONFLICT[\s\S]*DO NOTHING[\s\S]*RETURNING/i.test(text)) {
      const [scope, key, hash] = params;
      const k = `${scope}|${key}`;
      if (this._rows.has(k)) return { rows: [] };
      this._rows.set(k, { request_hash: hash, status_code: null, response_body: null });
      return { rows: [{ id: 1 }] };
    }

    // SELECT lookup
    if (/SELECT[\s\S]*FROM idempotency_keys/i.test(text)) {
      const [scope, key] = params;
      const row = this._rows.get(`${scope}|${key}`);
      return { rows: row ? [row] : [] };
    }

    // UPDATE finalise
    if (/^UPDATE idempotency_keys/i.test(text)) {
      const [scope, key, status, body] = params;
      const row = this._rows.get(`${scope}|${key}`);
      if (row) { row.status_code = status; row.response_body = body; }
      return { rowCount: row ? 1 : 0 };
    }

    return { rows: [] };
  }
};
require.cache[dbModulePath] = {
  id: dbModulePath, filename: dbModulePath, loaded: true,
  exports: { db: mockDb }
};

const { idempotent } = require('../src/middleware/idempotency');

/** Run the middleware against a fake req/res and return an outcome object. */
async function runMiddleware(mw, { body = {}, key = 'k-1', scope = 's' } = {}) {
  const req = {
    headers: key ? { 'idempotency-key': key } : {},
    body
  };
  const captured = {};
  const res = {
    statusCode: 200,
    set(h, v) { (this._headers ||= {})[h] = v; return this; },
    status(code) { captured.status = code; this.statusCode = code; return this; },
    json(obj) { captured.body = obj; return this; }
  };
  const next = () => { captured.nextCalled = true; };

  await mw(req, res, next);
  return { captured, req, res };
}

test('first request claims the key and calls next()', async () => {
  mockDb._rows.clear();
  const mw = idempotent({ scope: 's' });
  const { captured } = await runMiddleware(mw);
  assert.equal(captured.nextCalled, true);
  assert.equal(captured.status, undefined);
});

test('second concurrent request (same key, handler not yet finished) gets 409 IN_PROGRESS', async () => {
  mockDb._rows.clear();
  const mw = idempotent({ scope: 's' });
  await runMiddleware(mw); // first claim
  // Simulate concurrent attempt — row exists with status_code === null
  const { captured, res } = await runMiddleware(mw);
  assert.equal(captured.status, 409);
  assert.equal(captured.body.error.code, 'IDEMPOTENCY_IN_PROGRESS');
  assert.equal(res._headers['Retry-After'], '2');
});

test('retry after handler finished replays the cached response', async () => {
  mockDb._rows.clear();
  const mw = idempotent({ scope: 's' });
  // First call: claim + simulate the handler emitting a JSON response.
  const first = await runMiddleware(mw);
  first.res.statusCode = 201;
  first.res.json({ id: 'intent-42', amount: 1000 });

  // Retry the same key → should replay without calling next.
  const retry = await runMiddleware(mw);
  assert.equal(retry.captured.nextCalled, undefined);
  assert.equal(retry.captured.status, 201);
  assert.deepEqual(retry.captured.body, { id: 'intent-42', amount: 1000 });
  assert.equal(retry.res._headers['Idempotent-Replayed'], '1');
});

test('same key with different body returns 409 CONFLICT', async () => {
  mockDb._rows.clear();
  const mw = idempotent({ scope: 's' });
  const first = await runMiddleware(mw, { body: { amount: 1000 } });
  first.res.statusCode = 200;
  first.res.json({ ok: true });

  const { captured } = await runMiddleware(mw, { body: { amount: 5000 } });
  assert.equal(captured.status, 409);
  assert.equal(captured.body.error.code, 'IDEMPOTENCY_CONFLICT');
});

test('no header → pass-through, no DB touch', async () => {
  mockDb._rows.clear();
  mockDb._queries.length = 0;
  const mw = idempotent({ scope: 's' });
  const { captured } = await runMiddleware(mw, { key: null });
  assert.equal(captured.nextCalled, true);
  assert.equal(mockDb._queries.length, 0);
});

test('scope can be a function of req', async () => {
  mockDb._rows.clear();
  mockDb._queries.length = 0;
  const mw = idempotent({ scope: (req) => `school:${req.body.schoolId}` });
  await runMiddleware(mw, { body: { schoolId: 'abc' } });
  const insertParams = mockDb._queries.find((q) => /INSERT INTO idempotency_keys/.test(q.text)).params;
  assert.equal(insertParams[0], 'school:abc');
});
