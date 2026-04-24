'use strict';

/**
 * Add users.token_version. Bumped on password reset/change so existing
 * JWTs are rejected by authJwt — fixes the stateless-token "stolen
 * session survives a password change" problem.
 */
module.exports = {
  id: '002_token_version',
  async up(client) {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
    `);
  }
};
