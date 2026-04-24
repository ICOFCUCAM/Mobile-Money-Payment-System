'use strict';

/**
 * Ordered list of migrations. The runner applies any that aren't yet
 * recorded in the _migrations table, in this exact order.
 *
 * Rules:
 *   1. Append only — never reorder, never delete, never rename.
 *   2. Each migration's `id` is immutable. The runner tracks applied
 *      migrations by id, so renaming an id would cause it to re-run.
 *   3. Prefer forward-only changes. If a migration was wrong, ship a new
 *      one that fixes it rather than editing history.
 */

module.exports = [
  require('./001_initial_schema'),
  require('./002_token_version'),
  require('./003_wallet_nonnegative')
];
