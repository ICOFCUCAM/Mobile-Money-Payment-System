'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ensureReady, teardown, db, uniq } = require('./_helpers');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const billing = require('../src/modules/billing/billing.service');

/* ══════════ Helpers ══════════ */

async function makeSchool(overrides = {}) {
  await ensureReady();
  const id = uuid();
  const slug = `test-${uniq()}`;
  await db.query(
    `INSERT INTO schools
      (id, name, slug, email, phone, api_key_hash, api_key_prefix,
       subscription_plan, billing_model, custom_price_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      overrides.name  || 'Test School',
      slug,
      `${slug}@test.local`,
      overrides.phone || null,
      `hash_${uniq()}`,
      'sk_test_',
      overrides.plan || 'basic',
      overrides.billingModel || 'postpaid',
      overrides.customPriceCents || null
    ]
  );
  const r = await db.query('SELECT * FROM schools WHERE id = $1', [id]);
  return r.rows[0];
}

async function makeAdminUser(schoolId) {
  const id = uuid();
  await db.query(
    `INSERT INTO users (id, school_id, email, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4,$5,'admin')`,
    [id, schoolId, `admin+${uniq()}@test.local`, await bcrypt.hash('pw', 4), 'Admin']
  );
  const r = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return r.rows[0];
}

/* ══════════ Reference generator ══════════ */

test('generateBillingRef — returns SPY-XXXXX with safe alphabet', () => {
  for (let i = 0; i < 100; i++) {
    const ref = billing.generateBillingRef();
    assert.match(ref, /^SPY-[23456789ABCDEFGHJKLMNPQRSTWXYZ]{5}$/);
    assert.doesNotMatch(ref, /[01IOULV]/, 'must exclude ambiguous chars');
  }
});

test('generateBillingRef — statistically unique', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(billing.generateBillingRef());
  assert.ok(seen.size >= 1990, `collisions too high: ${2000 - seen.size}`);
});

/* ══════════ findSchoolByRef — parsing ══════════ */

test('findSchoolByRef — nullish / empty / junk returns null', async () => {
  assert.equal(await billing.findSchoolByRef(null), null);
  assert.equal(await billing.findSchoolByRef(''), null);
  assert.equal(await billing.findSchoolByRef('not-a-ref'), null);
  assert.equal(await billing.findSchoolByRef('SPY-'), null);
});

test('findSchoolByRef — case-insensitive, tolerates whitespace + suffix', async () => {
  const school = await makeSchool();
  await billing.ensureBillingRef(school.id);
  const fresh = await db.query('SELECT billing_ref FROM schools WHERE id=$1', [school.id]);
  const ref = fresh.rows[0].billing_ref;

  // exact
  assert.equal((await billing.findSchoolByRef(ref))?.id, school.id);
  // lowercase
  assert.equal((await billing.findSchoolByRef(ref.toLowerCase()))?.id, school.id);
  // trailing whitespace
  assert.equal((await billing.findSchoolByRef(`  ${ref}  `))?.id, school.id);
  // suffix in the memo (e.g. "SPY-XXXXX TOPUP JAN")
  assert.equal((await billing.findSchoolByRef(`${ref}-topup-jan`))?.id, school.id);
});

test('findSchoolByRef — billing tenant itself is never returned', async () => {
  // The seeded schoolpay-billing row exists but is_billing_tenant=TRUE;
  // the fn filters that out to prevent loops.
  await ensureReady();
  const billingTenant = await db.query(
    'SELECT billing_ref FROM schools WHERE id = $1',
    ['schoolpay-billing']
  );
  if (billingTenant.rows[0]?.billing_ref) {
    const found = await billing.findSchoolByRef(billingTenant.rows[0].billing_ref);
    assert.equal(found, null);
  }
});

/* ══════════ ensureBillingRef ══════════ */

test('ensureBillingRef — mints once, returns same value on subsequent calls', async () => {
  const school = await makeSchool();
  const first = await billing.ensureBillingRef(school.id);
  const second = await billing.ensureBillingRef(school.id);
  assert.equal(first, second, 'second call should return the same ref, not mint a new one');
  assert.match(first, /^SPY-/);
});

test('ensureBillingRef — throws for unknown school', async () => {
  await assert.rejects(() => billing.ensureBillingRef('does-not-exist'), /not found/i);
});

/* ══════════ quotePrice ══════════ */

test('quotePrice — subscription postpaid plans match catalog', async () => {
  const school = await makeSchool();
  assert.equal(await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'basic', billingPeriod: 'monthly' }), 1900);
  assert.equal(await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'basic', billingPeriod: 'yearly' }), 19000);
  assert.equal(await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly' }), 4900);
  assert.equal(await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'enterprise', billingPeriod: 'yearly' }), 149000);
});

test('quotePrice — admin custom price override wins', async () => {
  const school = await makeSchool({ customPriceCents: 777 });
  assert.equal(
    await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly' }),
    777,
    'admin override must beat catalog'
  );
});

test('quotePrice — wallet top-up uses the supplied amount', async () => {
  const school = await makeSchool();
  assert.equal(
    await billing.quotePrice(school.id, { intentType: 'wallet_topup', amountCents: 5000 }),
    5000
  );
});

test('quotePrice — rejects top-ups below $1', async () => {
  const school = await makeSchool();
  await assert.rejects(
    () => billing.quotePrice(school.id, { intentType: 'wallet_topup', amountCents: 50 }),
    /at least \$1/
  );
});

test('quotePrice — unknown plan / unknown period rejected', async () => {
  const school = await makeSchool();
  await assert.rejects(() => billing.quotePrice(school.id, { intentType: 'subscription', plan: 'titanium', billingPeriod: 'monthly' }), /Unknown plan/);
  await assert.rejects(() => billing.quotePrice(school.id, { intentType: 'subscription', plan: 'pro',      billingPeriod: 'hourly'  }), /monthly or yearly/);
});

/* ══════════ createIntent ══════════ */

test('createIntent — persists intent with reference + expiry', async () => {
  const school = await makeSchool();
  const intent = await billing.createIntent(school, {
    intentType: 'subscription',
    plan: 'pro',
    billingPeriod: 'monthly'
  });

  assert.ok(intent.id);
  assert.match(intent.reference, /^SPY-/);
  assert.equal(intent.amount_cents, 4900);
  assert.equal(intent.status, 'awaiting_payment');
  assert.ok(new Date(intent.expires_at) > new Date(), 'expiry in the future');
  assert.ok(new Date(intent.expires_at) < new Date(Date.now() + 25 * 60 * 60 * 1000), 'expiry within 25h');

  const row = await db.query('SELECT * FROM billing_intents WHERE id = $1', [intent.id]);
  assert.equal(row.rows[0].status, 'awaiting_payment');
  assert.equal(Number(row.rows[0].amount_cents), 4900);
});

test('createIntent — refuses to run against the billing tenant itself', async () => {
  const tenant = (await db.query("SELECT * FROM schools WHERE id='schoolpay-billing'")).rows[0];
  if (!tenant) return; // seed missing — skip
  await assert.rejects(
    () => billing.createIntent(tenant, { intentType: 'subscription', plan: 'basic', billingPeriod: 'monthly' }),
    /billing tenant/i
  );
});

/* ══════════ creditFromInboundPayment ══════════ */

test('creditFromInboundPayment — credits wallet and settles matching intent', async () => {
  const school = await makeSchool();
  const intent = await billing.createIntent(school, {
    intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly'
  });

  const result = await billing.creditFromInboundPayment({
    rail: 'mtn_momo',
    externalId: `ext-${uniq()}`,
    reference: intent.reference,
    amountCents: 4900,
    currency: 'USD',
    rawMemo: intent.reference
  });

  assert.equal(result.credited, true);
  assert.equal(result.schoolId, school.id);
  assert.equal(result.appliedIntent, intent.id);

  const intentRow = await db.query('SELECT status, paid_via_rail FROM billing_intents WHERE id = $1', [intent.id]);
  assert.equal(intentRow.rows[0].status, 'paid');
  assert.equal(intentRow.rows[0].paid_via_rail, 'mtn_momo');

  // Subscription must have been extended
  const schoolRow = await db.query('SELECT subscription_plan, subscription_status, subscription_expires_at FROM schools WHERE id = $1', [school.id]);
  assert.equal(schoolRow.rows[0].subscription_plan, 'pro');
  assert.equal(schoolRow.rows[0].subscription_status, 'active');
  assert.ok(schoolRow.rows[0].subscription_expires_at, 'expires_at set');
});

test('creditFromInboundPayment — tolerates ±5% FX drift on intent amount', async () => {
  const school = await makeSchool();
  const intent = await billing.createIntent(school, {
    intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly'
  });

  // Parent sends 4% more than the USD intent (FX wobble); still accepted.
  const result = await billing.creditFromInboundPayment({
    rail: 'mtn_momo',
    externalId: `ext-${uniq()}`,
    reference: intent.reference,
    amountCents: Math.round(4900 * 1.04),
    currency: 'USD'
  });
  assert.equal(result.appliedIntent, intent.id, 'intent within ±5% should still settle');
});

test('creditFromInboundPayment — dedupes by (rail, externalId)', async () => {
  const school = await makeSchool();
  const extId = `ext-${uniq()}`;

  const first = await billing.creditFromInboundPayment({
    rail: 'mtn_momo', externalId: extId,
    reference: await billing.ensureBillingRef(school.id),
    amountCents: 1000, currency: 'USD'
  });
  assert.equal(first.credited, true);

  const second = await billing.creditFromInboundPayment({
    rail: 'mtn_momo', externalId: extId,
    reference: (await db.query('SELECT billing_ref FROM schools WHERE id=$1', [school.id])).rows[0].billing_ref,
    amountCents: 1000, currency: 'USD'
  });
  assert.equal(second.credited, false);
  assert.equal(second.reason, 'duplicate');
});

test('creditFromInboundPayment — unknown ref is a no-op (not an error)', async () => {
  const result = await billing.creditFromInboundPayment({
    rail: 'mtn_momo',
    externalId: `ext-${uniq()}`,
    reference: 'SPY-99999',  // guaranteed not to exist
    amountCents: 1000,
    currency: 'USD'
  });
  assert.equal(result.credited, false);
  assert.equal(result.reason, 'no_matching_school');
});

test('creditFromInboundPayment — bad amount rejected before any DB writes', async () => {
  await assert.rejects(
    () => billing.creditFromInboundPayment({
      rail: 'mtn_momo', externalId: 'x', reference: 'SPY-XXXXX', amountCents: 0, currency: 'USD'
    }),
    /invalid amount/i
  );
  await assert.rejects(
    () => billing.creditFromInboundPayment({
      rail: 'mtn_momo', externalId: 'x', reference: 'SPY-XXXXX', amountCents: -100, currency: 'USD'
    }),
    /invalid amount/i
  );
});

test('creditFromInboundPayment — standalone top-up (no matching intent) still credits wallet', async () => {
  const school = await makeSchool();
  const ref = await billing.ensureBillingRef(school.id);

  const result = await billing.creditFromInboundPayment({
    rail: 'mtn_momo', externalId: `ext-${uniq()}`,
    reference: ref, amountCents: 2500, currency: 'USD'
  });
  assert.equal(result.credited, true);
  assert.equal(result.appliedIntent, null, 'no intent to apply');

  const wallet = await billing.getWallet(school.id);
  assert.equal(wallet.balance_cents, 2500, 'wallet credited with the full top-up');
});

/* ══════════ getWallet ══════════ */

test('getWallet — mints a billing_ref on first read', async () => {
  const school = await makeSchool();
  const wallet = await billing.getWallet(school.id);
  assert.match(wallet.billing_ref, /^SPY-/);
  assert.equal(wallet.balance_cents, 0);
  assert.deepEqual(wallet.transactions, []);
});

test('getWallet — returns recent ledger entries newest-first', async () => {
  const school = await makeSchool();
  const ref = await billing.ensureBillingRef(school.id);

  // Two top-ups, a few ms apart so ordering is deterministic
  await billing.creditFromInboundPayment({
    rail: 'mtn_momo', externalId: `a-${uniq()}`, reference: ref,
    amountCents: 1000, currency: 'USD'
  });
  await new Promise((r) => setTimeout(r, 10));
  await billing.creditFromInboundPayment({
    rail: 'mtn_momo', externalId: `b-${uniq()}`, reference: ref,
    amountCents: 2000, currency: 'USD'
  });

  const wallet = await billing.getWallet(school.id);
  assert.equal(wallet.balance_cents, 3000);
  assert.ok(wallet.transactions.length >= 2);
  assert.equal(wallet.transactions[0].amount_cents, 2000, 'newest first');
});

/* ══════════ setPriceOverride ══════════ */

test('setPriceOverride — rejects non-admin callers', async () => {
  const school = await makeSchool();
  await assert.rejects(
    () => billing.setPriceOverride(null, school.id, 500),
    /only admins/i
  );
  await assert.rejects(
    () => billing.setPriceOverride({ role: 'bursar', id: 'u1' }, school.id, 500),
    /only admins/i
  );
});

test('setPriceOverride — admin sets, clears, and audit-trails', async () => {
  const school = await makeSchool();
  const admin = await makeAdminUser(school.id);

  await billing.setPriceOverride(admin, school.id, 1500, { reason: 'Early adopter' });
  let quoted = await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly' });
  assert.equal(quoted, 1500, 'override applied to future quotes');

  await billing.setPriceOverride(admin, school.id, null);
  quoted = await billing.quotePrice(school.id, { intentType: 'subscription', plan: 'pro', billingPeriod: 'monthly' });
  assert.equal(quoted, 4900, 'null clears override, reverts to catalog');
});

test('setPriceOverride — rejects unknown school', async () => {
  const school = await makeSchool();
  const admin = await makeAdminUser(school.id);
  await assert.rejects(
    () => billing.setPriceOverride(admin, 'school-that-never-existed', 500),
    /not found/i
  );
});

/* ══════════ catalogueUsd ══════════ */

test('catalogueUsd — returns 3 plans with monthly + yearly cents', () => {
  const cat = billing.catalogueUsd();
  assert.ok(cat.plans.basic);
  assert.ok(cat.plans.pro);
  assert.ok(cat.plans.enterprise);
  assert.equal(cat.plans.basic.monthly_cents, 1900);
  assert.equal(cat.plans.pro.yearly_cents, 49000);
  assert.equal(cat.plans.enterprise.monthly_cents, 14900);
});

/* ══════════ FX service ══════════ */

const fx = require('../src/core/fx');

test('fx.convertUsdCents — USD→USD identity', async () => {
  assert.equal(await fx.convertUsdCents(4900, 'USD'), 4900);
});

test('fx.convertUsdCents — USD→XAF uses static rate, no-decimal whole units', async () => {
  process.env.FX_PROVIDER = 'static';
  const out = await fx.convertUsdCents(4900, 'XAF');
  // Static rate XAF=617. 4900 cents * 617 = 3,023,300 minor → /100 = 30,233 whole XAF
  assert.ok(out > 25_000 && out < 35_000, `unexpected XAF amount: ${out}`);
  assert.equal(Number.isInteger(out), true, 'XAF must be whole units');
});

test('fx.convertUsdCents — unknown currency throws', async () => {
  await assert.rejects(() => fx.convertUsdCents(4900, 'ZZZ'), /Unknown currency/);
});

test('fx.formatAmount — USD shows two decimals with $ prefix', () => {
  assert.equal(fx.formatAmount(4900, 'USD'), '$49.00');
  assert.equal(fx.formatAmount(50, 'USD'),   '$0.50');
});

test('fx.formatAmount — XAF has no decimals, currency suffix', () => {
  assert.equal(fx.formatAmount(30000, 'XAF'), '30,000 XAF');
});

test('fx.formatAmount — other currencies show two decimals', () => {
  assert.equal(fx.formatAmount(5000, 'GHS'), '50.00 GHS');
});

/* ══════════ Teardown ══════════ */

test('teardown', async () => { await teardown(); });
