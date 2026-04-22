'use strict';

const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
const { ValidationError, NotFoundError, ConflictError } = require('../../core/errors');
const logger = require('../../core/logger');

/* ═══════════════════════════════════════════════════════════════════════
 * Pricing catalogue — single source of truth for USD prices.
 * Match the values exposed on the Pricing page. Admin overrides (the
 * `custom_price_cents` column on schools) win at checkout time.
 * ═══════════════════════════════════════════════════════════════════ */
const PLANS = {
  basic:      { monthly: 1900,  yearly: 19000 },   // $19 / $190
  pro:        { monthly: 4900,  yearly: 49000 },   // $49 / $490
  enterprise: { monthly: 14900, yearly: 149000 }   // $149 / $1,490
};

/**
 * Generate a permanent billing reference for a school.
 *
 * Format: SPY-XXXXX  (5 chars from a Crockford-style alphabet
 * excluding ambiguous 0/O, 1/I/L, U/V for readability on MoMo UIs).
 * Callers must retry on UNIQUE conflict — probability is tiny
 * (<1 in 28M collision on the first million schools).
 */
const REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTWXYZ'; // 30 chars
function generateBillingRef() {
  const bytes = crypto.randomBytes(5);
  let out = '';
  for (let i = 0; i < 5; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return `SPY-${out}`;
}

/**
 * Find a school by its billing reference (case-insensitive, trimmed,
 * with forgiving suffix tolerance — a reference like "SPY-G7K4M-TOPUP"
 * or "spy-g7k4m" still matches SPY-G7K4M).
 */
async function findSchoolByRef(rawRef) {
  if (!rawRef) return null;
  const cleaned = String(rawRef).toUpperCase().replace(/\s+/g, '');
  // Accept the base "SPY-XXXXX" even if the user appended extra chars.
  const match = cleaned.match(/SPY-[A-Z0-9]{5}/);
  if (!match) return null;
  const r = await db.query(
    'SELECT * FROM schools WHERE billing_ref = $1 AND is_billing_tenant = FALSE LIMIT 1',
    [match[0]]
  );
  return r.rows[0] || null;
}

/** Ensure a given school has a billing reference; mint one if missing. */
async function ensureBillingRef(schoolId) {
  const existing = await db.query('SELECT billing_ref FROM schools WHERE id = $1', [schoolId]);
  if (!existing.rows[0]) throw new NotFoundError('School not found');
  if (existing.rows[0].billing_ref) return existing.rows[0].billing_ref;

  // Retry up to 5 times in the extremely unlikely event of a collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = generateBillingRef();
    try {
      await db.query('UPDATE schools SET billing_ref = $1 WHERE id = $2 AND billing_ref IS NULL', [ref, schoolId]);
      const check = await db.query('SELECT billing_ref FROM schools WHERE id = $1', [schoolId]);
      if (check.rows[0].billing_ref === ref) return ref;
    } catch (err) {
      if (err.code === '23505') continue; // UNIQUE constraint — retry
      throw err;
    }
  }
  throw new Error('Could not mint a unique billing reference after 5 attempts');
}

/**
 * Lookup or compute the USD price (in cents) a given school would be charged
 * for a subscription plan + billing period. Admin override takes precedence.
 */
async function quotePrice(schoolId, { intentType, plan, billingPeriod, amountCents }) {
  if (intentType === 'wallet_topup') {
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      throw new ValidationError('Top-up amount must be at least $1.00');
    }
    return Math.floor(amountCents);
  }
  if (intentType !== 'subscription') {
    throw new ValidationError(`Unknown intent type: ${intentType}`);
  }
  if (!PLANS[plan]) throw new ValidationError(`Unknown plan: ${plan}`);
  if (billingPeriod !== 'monthly' && billingPeriod !== 'yearly') {
    throw new ValidationError('billingPeriod must be monthly or yearly');
  }

  // Admin override check
  const s = await db.query(
    'SELECT custom_price_cents FROM schools WHERE id = $1',
    [schoolId]
  );
  const override = s.rows[0] && s.rows[0].custom_price_cents;
  if (override) return Number(override);

  return PLANS[plan][billingPeriod];
}

/**
 * Create a BillingIntent + ensure the school has a permanent ref.
 *
 * We return BOTH the intent-specific reference (what we display on the
 * checkout page) and the school's permanent billing_ref. A school can
 * always send a payment with just the permanent ref — we'll credit it to
 * their wallet instead of a specific intent.
 */
async function createIntent(school, {
  intentType,
  plan,
  billingPeriod,
  amountCents,
  localAmount,
  localCurrency
}) {
  if (school.is_billing_tenant) throw new ValidationError('Billing tenant cannot create intents');

  const usdCents = await quotePrice(school.id, { intentType, plan, billingPeriod, amountCents });
  const billingRef = await ensureBillingRef(school.id);

  const id = uuid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.query(
    `INSERT INTO billing_intents
      (id, school_id, intent_type, plan, billing_period,
       amount_cents, local_amount, local_currency, reference, status, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'awaiting_payment',$10)`,
    [
      id, school.id, intentType,
      plan || null, billingPeriod || null,
      usdCents, localAmount || null, localCurrency || null,
      billingRef, expiresAt
    ]
  );

  writeAudit({
    schoolId: school.id,
    action: 'billing.intent_created',
    entity: 'billing_intent',
    entityId: id,
    metadata: { intentType, plan, billingPeriod, usdCents }
  });

  return {
    id,
    reference: billingRef,
    amount_cents: usdCents,
    local_amount: localAmount,
    local_currency: localCurrency,
    expires_at: expiresAt,
    status: 'awaiting_payment',
    intent_type: intentType,
    plan,
    billing_period: billingPeriod
  };
}

/**
 * Credit a school's wallet from an incoming MoMo (or future bank) webhook.
 *
 * Flow:
 *   1. Resolve reference → school
 *   2. Dedupe by (provider, external_id) — same ledger UNIQUE trick we use
 *      for student payments
 *   3. Match the most recent awaiting_payment intent with the same ref;
 *      if found, mark it paid and apply its plan side-effect.
 *      If none: it's an ad-hoc wallet top-up.
 *   4. Append a wallet_transactions row + update schools.wallet_balance_cents
 *      atomically in one transaction.
 */
async function creditFromInboundPayment({ rail, externalId, reference, amountCents, currency, rawMemo }) {
  if (!amountCents || amountCents <= 0) throw new ValidationError('Missing or invalid amount');

  const school = await findSchoolByRef(reference);
  if (!school) {
    logger.warn(`Billing webhook: no school matches reference "${reference}" (tx ${externalId})`);
    return { credited: false, reason: 'no_matching_school' };
  }

  // Dedupe: if we've already recorded a wallet_transactions row for this
  // (rail, externalId), skip.
  const dupeCheck = await db.query(
    "SELECT id FROM wallet_transactions WHERE meta LIKE $1 AND school_id = $2 LIMIT 1",
    [`%"rail":"${rail}","external_id":"${externalId}"%`, school.id]
  );
  if (dupeCheck.rows.length) {
    return { credited: false, reason: 'duplicate', schoolId: school.id };
  }

  // Find a matching open intent (most recent awaiting_payment with this ref,
  // and amount within ±5% to forgive FX wobble).
  const intentRes = await db.query(
    `SELECT * FROM billing_intents
       WHERE school_id = $1 AND reference = $2 AND status = 'awaiting_payment'
       ORDER BY created_at DESC
       LIMIT 1`,
    [school.id, school.billing_ref]
  );
  const intent = intentRes.rows[0] || null;

  const result = await db.withTransaction(async (client) => {
    // 1. Append the credit to the wallet ledger
    const walletTxId = uuid();
    const newBalance = Number(school.wallet_balance_cents || 0) + Number(amountCents);

    await client.query(
      `INSERT INTO wallet_transactions
        (id, school_id, kind, amount_cents, balance_after, currency, billing_intent_id, memo, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        walletTxId, school.id, rail === 'bank_transfer' ? 'topup_bank' : 'topup_momo',
        amountCents, newBalance, currency || 'USD',
        intent ? intent.id : null,
        rawMemo || null,
        JSON.stringify({ rail, external_id: externalId, reference })
      ]
    );
    await client.query(
      'UPDATE schools SET wallet_balance_cents = $1, updated_at = NOW() WHERE id = $2',
      [newBalance, school.id]
    );

    // 2. If there's a matching intent, mark it paid and apply its side-effect
    let appliedIntent = null;
    if (intent && Number(intent.amount_cents) > 0) {
      const pctDiff = Math.abs(Number(amountCents) - Number(intent.amount_cents)) / Number(intent.amount_cents);
      if (pctDiff <= 0.05) {
        await client.query(
          `UPDATE billing_intents
             SET status = 'paid', paid_at = NOW(), paid_via_rail = $1, paid_via_tx_id = $2
           WHERE id = $3`,
          [rail, externalId, intent.id]
        );

        // Subscription side-effect: extend subscription_expires_at
        if (intent.intent_type === 'subscription') {
          const months = intent.billing_period === 'yearly' ? 12 : 1;
          await client.query(
            `UPDATE schools
               SET subscription_plan = $1,
                   subscription_status = 'active',
                   subscription_expires_at = COALESCE(
                     GREATEST(subscription_expires_at, NOW()),
                     NOW()
                   ) + ($2 || ' months')::interval,
                   wallet_balance_cents = wallet_balance_cents - $3,
                   updated_at = NOW()
             WHERE id = $4`,
            [intent.plan, String(months), Number(intent.amount_cents), school.id]
          );
          // Also record the immediate debit so the ledger stays in sync
          const debitBalance = newBalance - Number(intent.amount_cents);
          await client.query(
            `INSERT INTO wallet_transactions
              (id, school_id, kind, amount_cents, balance_after, currency, billing_intent_id, memo)
             VALUES ($1,$2,'debit_subscription',$3,$4,'USD',$5,$6)`,
            [uuid(), school.id, -Number(intent.amount_cents), debitBalance, intent.id,
             `${intent.plan} · ${intent.billing_period}`]
          );
        }
        appliedIntent = intent.id;
      }
    }

    return { walletTxId, appliedIntent };
  });

  writeAudit({
    schoolId: school.id,
    action: 'billing.inbound_payment',
    entity: 'wallet_transaction',
    entityId: result.walletTxId,
    metadata: { rail, externalId, amountCents, appliedIntent: result.appliedIntent }
  });

  return {
    credited: true,
    schoolId: school.id,
    walletTxId: result.walletTxId,
    appliedIntent: result.appliedIntent
  };
}

/** Fetch wallet balance + recent ledger entries for a school. */
async function getWallet(schoolId, { limit = 20 } = {}) {
  const s = await db.query(
    'SELECT id, billing_ref, wallet_balance_cents, billing_currency, subscription_plan, subscription_status, subscription_expires_at, custom_price_cents FROM schools WHERE id = $1',
    [schoolId]
  );
  const school = s.rows[0];
  if (!school) throw new NotFoundError('School not found');
  if (!school.billing_ref) {
    school.billing_ref = await ensureBillingRef(schoolId);
  }

  const txs = await db.query(
    `SELECT id, kind, amount_cents, balance_after, currency, billing_intent_id, memo, created_at
       FROM wallet_transactions
       WHERE school_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
    [schoolId, Math.min(limit, 100)]
  );

  return {
    billing_ref: school.billing_ref,
    balance_cents: Number(school.wallet_balance_cents || 0),
    currency: school.billing_currency || 'USD',
    subscription: {
      plan: school.subscription_plan,
      status: school.subscription_status,
      expires_at: school.subscription_expires_at
    },
    custom_price_cents: school.custom_price_cents ? Number(school.custom_price_cents) : null,
    transactions: txs.rows
  };
}

/**
 * Admin-only: set a custom subscription price (in cents) for a specific
 * school. Passing null clears the override and reverts to catalog pricing.
 */
async function setPriceOverride(adminUser, targetSchoolId, customPriceCents, { reason } = {}) {
  if (!adminUser || adminUser.role !== 'admin') {
    throw new ValidationError('Only admins can set price overrides');
  }
  if (customPriceCents != null && (!Number.isFinite(customPriceCents) || customPriceCents < 0)) {
    throw new ValidationError('customPriceCents must be a non-negative number or null');
  }

  const r = await db.query(
    'UPDATE schools SET custom_price_cents = $1, updated_at = NOW() WHERE id = $2 RETURNING id, custom_price_cents',
    [customPriceCents != null ? Math.floor(customPriceCents) : null, targetSchoolId]
  );
  if (!r.rows[0]) throw new NotFoundError('School not found');

  writeAudit({
    schoolId: targetSchoolId,
    userId: adminUser.id,
    action: 'billing.price_override_set',
    metadata: { customPriceCents, reason: reason || null }
  });

  return { id: r.rows[0].id, custom_price_cents: r.rows[0].custom_price_cents };
}

/** Expose catalog for the frontend checkout page. */
function catalogueUsd() {
  return {
    plans: Object.keys(PLANS).reduce((acc, key) => {
      acc[key] = {
        monthly_cents: PLANS[key].monthly,
        yearly_cents:  PLANS[key].yearly
      };
      return acc;
    }, {})
  };
}

/**
 * List every real tenant (excludes the schoolpay-billing internal one)
 * for the admin override UI. Returns balance + subscription + override +
 * last-topup date so the admin can see the whole picture in one table.
 */
async function listSchoolsForAdmin() {
  const r = await db.query(
    `SELECT
       s.id, s.name, s.slug, s.email,
       s.subscription_plan, s.subscription_status, s.subscription_expires_at,
       s.wallet_balance_cents, s.billing_ref, s.custom_price_cents,
       s.is_active, s.created_at,
       (SELECT MAX(created_at) FROM wallet_transactions
          WHERE school_id = s.id AND kind LIKE 'topup_%') AS last_topup_at
     FROM schools s
     WHERE s.is_billing_tenant = FALSE
     ORDER BY s.created_at DESC`
  );
  return r.rows;
}

module.exports = {
  PLANS,
  generateBillingRef,
  findSchoolByRef,
  ensureBillingRef,
  quotePrice,
  createIntent,
  creditFromInboundPayment,
  getWallet,
  setPriceOverride,
  catalogueUsd,
  listSchoolsForAdmin
};
