'use strict';

const service = require('./billing.service');
const fx = require('../../core/fx');

/** GET /api/billing/fx?to=XAF&usdCents=4900  — public FX conversion */
async function fxQuote(req, res) {
  const to = String(req.query.to || 'USD').toUpperCase();
  const usdCents = Math.max(0, parseInt(String(req.query.usdCents || '0'), 10));
  const rates = await fx.ratesVsUsd();
  const rate = rates[to];
  if (!rate) return res.status(400).json({ error: { code: 'UNKNOWN_CURRENCY', message: `Unknown currency ${to}` } });
  const localAmount = await fx.convertUsdCents(usdCents, to);
  res.json({
    base: 'USD',
    to,
    rate,                       // units of `to` per 1 USD
    usd_cents: usdCents,
    local_amount: localAmount,  // already humanized per currency
    local_display: fx.formatAmount(localAmount, to),
    usd_display: fx.formatAmount(usdCents, 'USD')
  });
}

/** POST /api/billing/intents */
async function createIntent(req, res) {
  const body = req.body || {};
  const intent = await service.createIntent(req.school, {
    intentType:    body.intent_type    || 'subscription',
    plan:          body.plan,
    billingPeriod: body.billing_period,
    amountCents:   body.amount_cents,
    localAmount:   body.local_amount,
    localCurrency: body.local_currency
  });
  res.status(201).json({ intent });
}

/** GET /api/billing/wallet */
async function getWallet(req, res) {
  const wallet = await service.getWallet(req.school.id);
  res.json({ wallet });
}

/** GET /api/billing/catalog  — public USD prices (no auth needed, it's marketing-level) */
async function catalog(_req, res) {
  res.json(service.catalogueUsd());
}

/**
 * POST /api/admin/billing/override
 * Body: { school_id, custom_price_cents (or null), reason? }
 *
 * Admin-only: platform-level override for a specific school. The requesting
 * user must be role=admin AND be a user of the schoolpay_billing tenant
 * (only our own staff gets to override).
 */
async function setOverride(req, res) {
  const { school_id, custom_price_cents, reason } = req.body || {};
  const result = await service.setPriceOverride(req.user, school_id, custom_price_cents, { reason });
  res.json({ ok: true, ...result });
}

/** GET /api/billing/admin/schools — admin-only */
async function adminListSchools(_req, res) {
  const schools = await service.listSchoolsForAdmin();
  res.json({ schools });
}

module.exports = { createIntent, getWallet, catalog, setOverride, adminListSchools, fxQuote };
