'use strict';

const { db } = require('../../core/database');
const { hashApiKey } = require('../../middleware/auth');
const { AuthError } = require('../../core/errors');

/**
 * Public API auth. Accepts the school API key via either:
 *   - `Authorization: Bearer <key>`  (preferred for third-party school sites)
 *   - `X-API-Key: <key>`              (back-compat with internal clients)
 *
 * Resolves req.school. No JWT path — this route is only for machine-to-machine
 * calls from school websites using their API key.
 */
async function authSchoolApiKey(req, _res, next) {
  try {
    let key = null;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      key = header.slice(7).trim();
    } else if (req.headers['x-api-key']) {
      key = String(req.headers['x-api-key']).trim();
    }
    if (!key) throw new AuthError('Missing API key. Send Authorization: Bearer SCHOOL_API_KEY');

    const hash = hashApiKey(key);
    const r = await db.query(
      'SELECT * FROM schools WHERE api_key_hash = $1 AND is_active = TRUE',
      [hash]
    );
    const school = r.rows[0];
    if (!school) throw new AuthError('Invalid or inactive API key');

    req.school = school;
    req.authVia = 'api_key';
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authSchoolApiKey };
