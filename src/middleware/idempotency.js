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

    // Race-safe claim. Previous version did SELECT then INSERT-on-return,
    // so two concurrent first-attempts both ran the handler (double-charge
    // risk on retried payments). This single INSERT ... ON CONFLICT DO
    // NOTHING RETURNING tells us whether WE claimed the key, atomically.
    // status_code = NULL is the sentinel for "handler in-flight".
    let claimed;
    try {
      // Short TTL (2 min) on the initial claim so a handler that crashes
      // mid-flight doesn't lock the key out for the full 24h. The
      // finalise below bumps expires_at to 24h once the response is
      // captured.
      claimed = await db.query(
        `INSERT INTO idempotency_keys (scope, key, request_hash, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '2 minutes')
         ON CONFLICT (scope, key) DO NOTHING
         RETURNING id`,
        [scopeValue, String(key), bodyHash]
      );
    } catch (err) {
      // DB blip — don't block the real request.
      logger.warn('Idempotency claim failed — proceeding without cache', err);
      return next();
    }

    if (claimed.rows.length === 0) {
      // Someone else owns this key. Look up to decide: replay if the other
      // request finished, or surface a 409 if it's still in flight.
      let existing;
      try {
        existing = await db.query(
          `SELECT request_hash, status_code, response_body
             FROM idempotency_keys
            WHERE scope = $1 AND key = $2 AND expires_at > NOW()`,
          [scopeValue, String(key)]
        );
      } catch (err) {
        logger.warn('Idempotency lookup failed — proceeding without cache', err);
        return next();
      }
      const row = existing.rows[0];
      if (!row) return next(); // row already expired / GC'd; treat as fresh
      if (row.request_hash !== bodyHash) {
        return res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Idempotency-Key reused with a different request body'
          }
        });
      }
      if (row.status_code === null) {
        // First attempt is still running. Tell the client to retry later.
        res.set('Retry-After', '2');
        return res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_IN_PROGRESS',
            message: 'A request with this Idempotency-Key is still being processed'
          }
        });
      }
      // Completed — replay verbatim.
      res.set('Idempotent-Replayed', '1');
      return res.status(row.status_code).json(row.response_body);
    }

    // We own the key. Run the handler and capture the response so a retry
    // within 24h gets the exact same thing back.
    const origJson = res.json.bind(res);
    res.json = (body) => {
      db.query(
        `UPDATE idempotency_keys
            SET status_code   = $3,
                response_body = $4,
                expires_at    = NOW() + INTERVAL '24 hours'
          WHERE scope = $1 AND key = $2`,
        [scopeValue, String(key), res.statusCode, body]
      ).catch((err) => logger.warn('Idempotency cache finalise failed', err));
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
