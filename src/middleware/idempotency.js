'use strict';

const crypto = require('crypto');
const { db } = require('../core/database');
const logger = require('../core/logger');

/**
 * Idempotency middleware.
 *
 * Usage:
 *   router.post('/intents', idempotent({ scope: req => `school:${req.school.id}` }), handler)
 *
 * Clients include   Idempotency-Key: <uuid-or-any-unique-string>   on write
 * requests. Same key within 24h → we replay the exact response we captured
 * the first time (status + body). Same key, DIFFERENT body → 409.
 *
 * Best-effort: DB errors in this middleware never block the real handler,
 * they just skip the cache.
 */
function idempotent({ scope = defaultScope } = {}) {
  return async function idempotencyMiddleware(req, res, next) {
    const key = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
    if (!key) return next(); // opt-in — no key, no caching

    const scopeValue = typeof scope === 'function' ? scope(req) : String(scope);
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    try {
      const existing = await db.query(
        `SELECT request_hash, status_code, response_body
           FROM idempotency_keys
          WHERE scope = $1 AND key = $2 AND expires_at > NOW()`,
        [scopeValue, String(key)]
      );

      if (existing.rows.length) {
        const row = existing.rows[0];
        if (row.request_hash !== bodyHash) {
          // Same key, different body — classic idempotency-key violation
          return res.status(409).json({
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              message: 'Idempotency-Key reused with a different request body'
            }
          });
        }
        // Replay the cached response verbatim
        res.set('Idempotent-Replayed', '1');
        return res.status(row.status_code).json(row.response_body);
      }
    } catch (err) {
      logger.warn('Idempotency lookup failed — proceeding without cache', err);
      return next();
    }

    // No cached entry — run the handler and capture the response so a
    // retry within 24h gets the exact same thing back.
    const origJson = res.json.bind(res);
    res.json = (body) => {
      // Persist in background — don't block the response.
      db.query(
        `INSERT INTO idempotency_keys
           (scope, key, request_hash, status_code, response_body)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (scope, key) DO NOTHING`,
        [scopeValue, String(key), bodyHash, res.statusCode, body]
      ).catch((err) => logger.warn('Idempotency cache write failed', err));
      return origJson(body);
    };
    next();
  };
}

function defaultScope(req) {
  if (req.school && req.school.id) return `school:${req.school.id}`;
  if (req.user && req.user.id) return `user:${req.user.id}`;
  return `anon:${req.ip || 'unknown'}`;
}

module.exports = { idempotent };
