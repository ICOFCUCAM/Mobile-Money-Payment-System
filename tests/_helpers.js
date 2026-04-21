'use strict';

/**
 * Shared test helpers. Every test file requires this first — it:
 *  1. Sets required env vars before `config` is loaded.
 *  2. Monkey-patches the MTN + Orange providers so no network is used.
 *  3. Initialises the Postgres schema.
 *
 * Tests must pick unique slugs/emails per case (use `uniq()`) so parallel
 * runs don't collide.
 */

require('dotenv').config();

// Must happen before config is required anywhere.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  '00000000000000000000000000000000000000000000000000000000000000aa';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_long_enough_to_be_fine';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/schoolpay_test?sslmode=disable';

const MTNProvider = require('../src/providers/MTNProvider');
const OrangeProvider = require('../src/providers/OrangeProvider');

// Default: every verify call returns a successful 5000 XAF transaction.
// Tests can override .mockNext to stage a specific response for the next call.
let mtnNext = null;
MTNProvider.prototype.verifyTransaction = async function (id) {
  const staged = mtnNext;
  mtnNext = null;
  return (
    staged || {
      ok: true,
      status: 'success',
      amount: 5000,
      currency: 'XAF',
      phone: '237600000000',
      raw: { id, mocked: true }
    }
  );
};

let orangeNext = null;
OrangeProvider.prototype.verifyTransaction = async function (id) {
  const staged = orangeNext;
  orangeNext = null;
  return staged || { ok: true, status: 'success', amount: 2500, currency: 'XAF', raw: { id } };
};

function stageMTN(result) { mtnNext = result; }
function stageOrange(result) { orangeNext = result; }

const { initDatabase, db, getPool } = require('../src/core/database');

let ready;
function ensureReady() {
  if (!ready) ready = initDatabase();
  return ready;
}

function uniq() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function teardown() {
  try { await getPool().end(); } catch (_) { /* ignore */ }
}

module.exports = {
  ensureReady,
  uniq,
  teardown,
  db,
  stageMTN,
  stageOrange
};
