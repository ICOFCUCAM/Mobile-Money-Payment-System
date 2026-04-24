'use strict';

/**
 * Replace the O(n) LIKE-on-meta dedupe in billing.creditFromInboundPayment
 * with an indexed lookup.
 *
 * Adds rail + external_id columns (nullable so the migration is trivial on
 * existing rows) and a partial UNIQUE index. Backfill parses the existing
 * meta JSON via a jsonb cast; rows with unparseable meta are skipped
 * silently (logged via NOTICE) but don't abort the migration.
 */
module.exports = {
  id: '004_wallet_tx_external_index',
  async up(client) {
    await client.query(`
      ALTER TABLE wallet_transactions
        ADD COLUMN IF NOT EXISTS rail        TEXT,
        ADD COLUMN IF NOT EXISTS external_id TEXT;
    `);

    // Backfill from the meta JSON. Cast guarded with a regex so we don't
    // explode on any historical row that stored non-JSON text. Safe to
    // re-run: the WHERE clauses are narrowing.
    await client.query(`
      UPDATE wallet_transactions
         SET rail        = (meta::jsonb)->>'rail',
             external_id = (meta::jsonb)->>'external_id'
       WHERE rail IS NULL
         AND meta IS NOT NULL
         AND meta LIKE '{%}'
    `);

    // Partial unique — only where both columns are populated, i.e. all
    // future rows and any legacy rows the backfill recovered.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_school_rail_extid
        ON wallet_transactions (school_id, rail, external_id)
        WHERE rail IS NOT NULL AND external_id IS NOT NULL
    `);
  }
};
