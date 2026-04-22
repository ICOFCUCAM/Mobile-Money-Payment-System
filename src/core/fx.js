'use strict';

/**
 * Lightweight FX service.
 *
 * Policy:
 *   1. Rates are quoted WITH USD as the base. We cache them in memory and
 *      refresh every 6h (exchange rates barely move intraday).
 *   2. If the upstream provider is unavailable we fall back to a hand-maintained
 *      static table so billing never breaks on infra flakes.
 *   3. FX_PROVIDER env var picks the source:
 *        - "static"  (default, zero deps, always works)
 *        - "exchangerate_host" (free, no auth: https://exchangerate.host/)
 *        - "open_er"            (free tier, needs OPEN_ER_API_KEY)
 *
 * Amounts everywhere in the backend are integer minor units.
 *   - USD:  cents    ($1.00 → 100)
 *   - XAF:  no decimals; we still use the same convention, so 1 XAF → 100
 *     minor "units" even though XAF isn't conventionally divided.
 *   Callers who want whole-XAF should divide by 100 on the way out.
 */

const logger = require('./logger');

// Static fallback table — representative December 2024 levels. Updated when
// the automated providers come online. Keyed by ISO 4217 code, value is
// "how many UNITS of foreign currency equal 1 USD".
const STATIC_RATES_VS_USD = {
  USD: 1,
  XAF: 617,    // Central African franc
  XOF: 615,    // West African franc
  NGN: 1530,   // Nigerian naira
  KES: 129,    // Kenyan shilling
  GHS: 15.2,   // Ghanaian cedi
  UGX: 3700,   // Ugandan shilling
  TZS: 2550,   // Tanzanian shilling
  RWF: 1365,   // Rwandan franc
  ZAR: 18.3,   // South African rand
  ZMW: 27.0,   // Zambian kwacha
  MWK: 1730,   // Malawian kwacha
  EUR: 0.94,
  GBP: 0.79
};

// Currencies that don't conventionally have decimal subunits. We still store
// amounts as "× 100 minor units" internally so math stays consistent.
const NO_DECIMAL_CURRENCIES = new Set(['XAF', 'XOF', 'RWF', 'UGX', 'BIF', 'DJF', 'JPY', 'KRW']);

let cache = { rates: null, fetchedAt: 0 };
const CACHE_MS = 6 * 60 * 60 * 1000;

async function fetchFromUpstream() {
  const provider = (process.env.FX_PROVIDER || 'static').toLowerCase();
  if (provider === 'static') return STATIC_RATES_VS_USD;

  if (provider === 'exchangerate_host') {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=USD', { headers: { Accept: 'application/json' } });
      const j = await res.json();
      if (j && j.rates) return { ...STATIC_RATES_VS_USD, ...j.rates, USD: 1 };
    } catch (err) {
      logger.warn('FX upstream exchangerate.host failed', err.message);
    }
  }

  if (provider === 'open_er' && process.env.OPEN_ER_API_KEY) {
    try {
      const url = `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPEN_ER_API_KEY}`;
      const res = await fetch(url);
      const j = await res.json();
      if (j && j.rates) return { ...STATIC_RATES_VS_USD, ...j.rates, USD: 1 };
    } catch (err) {
      logger.warn('FX upstream openexchangerates failed', err.message);
    }
  }

  return STATIC_RATES_VS_USD;
}

async function ratesVsUsd() {
  const now = Date.now();
  if (cache.rates && now - cache.fetchedAt < CACHE_MS) return cache.rates;
  cache = { rates: await fetchFromUpstream(), fetchedAt: now };
  return cache.rates;
}

/**
 * Convert a USD cents amount to a given currency's minor units at today's rate.
 * Returns an integer — callers don't need to worry about rounding quirks.
 *   cents = 4900 ("$49.00") → { XAF: 3_023_000 } i.e. 30,230 XAF
 */
async function convertUsdCents(usdCents, toCurrency) {
  const to = (toCurrency || 'USD').toUpperCase();
  if (to === 'USD') return usdCents;

  const rates = await ratesVsUsd();
  const rate = rates[to];
  if (!rate) throw new Error(`Unknown currency ${to}`);

  // Foreign units = USD units × rate
  // In minor units: foreignMinor = (usdCents / 100) × rate × minorFactor
  // But we're storing both in ×100 minor convention for math consistency,
  // so: foreignMinor = usdCents × rate  (the factor of 100 cancels).
  //
  // For display we hand back the "humanized" amount (whole units for
  // no-decimal currencies, 2-decimal units for the rest).
  const rawMinor = Math.round(usdCents * rate);
  if (NO_DECIMAL_CURRENCIES.has(to)) {
    // Render whole units, so divide out the 100.
    return Math.round(rawMinor / 100);
  }
  return rawMinor;
}

/**
 * Turn a raw amount + currency into a nicely-formatted string for the UI.
 *   formatAmount(30230, 'XAF') → "30,230 XAF"
 *   formatAmount(4900, 'USD')  → "$49.00"
 */
function formatAmount(amount, currency) {
  const c = (currency || 'USD').toUpperCase();
  if (c === 'USD') return `$${(amount / 100).toFixed(2)}`;
  if (NO_DECIMAL_CURRENCIES.has(c)) {
    return `${Number(amount).toLocaleString()} ${c}`;
  }
  return `${(amount / 100).toFixed(2)} ${c}`;
}

module.exports = {
  ratesVsUsd,
  convertUsdCents,
  formatAmount,
  STATIC_RATES_VS_USD,
  NO_DECIMAL_CURRENCIES
};
