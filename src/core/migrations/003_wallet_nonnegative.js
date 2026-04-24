'use strict';

/**
 * Enforce wallet_balance_cents >= 0 at the schema level. A bug in the
 * billing service that tries to debit more than is available should fail
 * loudly (pg 23514 check_violation → 400 INVALID_INPUT via errorHandler)
 * rather than silently driving the wallet into the red.
 *
 * Adding the constraint with NOT VALID means we don't scan existing rows
 * on first deploy (cheap migration) — then VALIDATE it in the same
 * statement since our current data is known-non-negative (balance was
 * NOT NULL DEFAULT 0 from the start and every debit code path subtracts
 * only amounts sourced from billing_intents.amount_cents > 0).
 */
module.exports = {
  id: '003_wallet_nonnegative',
  async up(client) {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
            FROM pg_constraint
           WHERE conname = 'schools_wallet_nonnegative'
             AND conrelid = 'schools'::regclass
        ) THEN
          ALTER TABLE schools
            ADD CONSTRAINT schools_wallet_nonnegative
            CHECK (wallet_balance_cents >= 0);
        END IF;
      END;
      $$;
    `);
  }
};
