'use strict';

/**
 * End-to-end smoke test used by CI. Exercises the golden path against a real
 * Postgres instance provided via DATABASE_URL. Monkey-patches the MTN provider
 * so we don't need outbound network to a mobile-money sandbox.
 *
 * Usage: node tests/smoke.js
 */

require('dotenv').config();

const assert = require('node:assert/strict');

// Stub the MTN provider before app loads.
const MTNProvider = require('../src/providers/MTNProvider');
MTNProvider.prototype.verifyTransaction = async function (id) {
  return { ok: true, status: 'success', amount: 5000, currency: 'XAF', phone: '237680000000', raw: { id, mocked: true } };
};

const app = require('../src/app');
const { initDatabase, getPool, db } = require('../src/core/database');

const uniq = `t${Date.now().toString(36)}`;

(async () => {
  await initDatabase();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const json = (res) => res.text().then((t) => (t ? JSON.parse(t) : null));
  const hdr = (tok) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` });

  try {
    let r = await fetch(`${base}/health`);
    assert.equal(r.status, 200, 'health should be 200');

    r = await fetch(`${base}/api/schools/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme School',
        slug: `acme-${uniq}`,
        email: `admin-${uniq}@acme.edu`,
        adminName: 'Admin',
        password: 'supersecret',
        plan: 'pro'
      })
    });
    assert.equal(r.status, 201, 'register should be 201');
    const reg = await json(r);
    assert.ok(reg.apiKey, 'apiKey returned');

    r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `admin-${uniq}@acme.edu`, password: 'supersecret' })
    });
    assert.equal(r.status, 200, 'login 200');
    const tok = (await json(r)).token;

    r = await fetch(`${base}/api/schools/me/payment-configs`, {
      method: 'PUT',
      headers: hdr(tok),
      body: JSON.stringify({ provider: 'MTN', api_key: 'k', api_secret: 's' })
    });
    assert.equal(r.status, 201);

    r = await fetch(`${base}/api/students`, {
      method: 'POST',
      headers: hdr(tok),
      body: JSON.stringify({ studentCode: 'STU1', fullName: 'Jane Doe' })
    });
    assert.equal(r.status, 201);

    r = await fetch(`${base}/api/payments`, {
      method: 'POST',
      headers: hdr(tok),
      body: JSON.stringify({ studentCode: 'STU1', provider: 'MTN', externalId: `MoMo-${uniq}` })
    });
    assert.equal(r.status, 201, 'payment submit 201');

    r = await fetch(`${base}/api/payments`, {
      method: 'POST',
      headers: hdr(tok),
      body: JSON.stringify({ studentCode: 'STU1', provider: 'MTN', externalId: `MoMo-${uniq}` })
    });
    assert.equal(r.status, 409, 'duplicate payment 409');

    r = await fetch(`${base}/api/dashboard/overview`, { headers: hdr(tok) });
    const ov = await json(r);
    assert.equal(ov.summary.success, 1);
    assert.equal(ov.summary.amount_collected, 5000);

    // Plan gating
    const slug2 = `small-${uniq}`;
    await fetch(`${base}/api/schools/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Small', slug: slug2, email: `small-${uniq}@x.edu`, adminName: 'a', password: 'supersecret', plan: 'basic'
      })
    });
    const tok2 = (await (await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `small-${uniq}@x.edu`, password: 'supersecret' })
    })).json()).token;
    r = await fetch(`${base}/api/payments`, {
      method: 'POST',
      headers: hdr(tok2),
      body: JSON.stringify({ studentCode: 'X', provider: 'ORANGE', externalId: 'y' })
    });
    assert.equal(r.status, 402, 'basic plan blocks orange');

    // Cleanup to keep CI DB tidy across runs
    await db.query('DELETE FROM schools WHERE slug IN ($1, $2)', [`acme-${uniq}`, slug2]);

    console.log('Smoke test passed.');
    server.close();
    await getPool().end();
  } catch (err) {
    console.error('Smoke test FAILED:', err);
    server.close();
    try { await getPool().end(); } catch (_) { /* ignore */ }
    process.exit(1);
  }
})();
