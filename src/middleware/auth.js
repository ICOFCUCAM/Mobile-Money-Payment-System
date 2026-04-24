'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { db } = require('../core/database');
const { AuthError } = require('../core/errors');
const logger = require('../core/logger');

function signToken(payload) {
  return jwt.sign(payload, config.security.jwtSecret, { expiresIn: config.security.jwtExpiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.security.jwtSecret);
  } catch (_) {
    throw new AuthError('Invalid or expired token');
  }
}

function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

/**
 * Requires a valid JWT. Populates req.user and req.school.
 */
async function authJwt(req, _res, next) {
  try {
    const token = extractBearer(req);
    if (!token) throw new AuthError('Missing auth token');
    const payload = verifyToken(token);

    // One query, not two: the JOIN lets us fetch user + school in a single
    // round-trip. Every authenticated request runs this, so halving the DB
    // hits here is felt across the whole app.
    const res = await db.query(
      `SELECT u.id, u.school_id, u.email, u.role, u.is_active, u.token_version,
              s.id AS s_id, s.name AS s_name, s.slug AS s_slug, s.email AS s_email,
              s.phone AS s_phone, s.subscription_plan AS s_plan,
              s.subscription_status AS s_status, s.subscription_expires_at AS s_expires_at,
              s.is_active AS s_active,
              s.is_billing_tenant, s.billing_model, s.license_tier,
              s.billing_ref, s.wallet_balance_cents, s.billing_currency,
              s.custom_price_cents
         FROM users u
         JOIN schools s ON s.id = u.school_id
        WHERE u.id = $1`,
      [payload.sub]
    );
    const row = res.rows[0];
    if (!row || !row.is_active) throw new AuthError('User not found or disabled');
    if (!row.s_active) throw new AuthError('School not active');

    // Token version gate: bumped by changePassword / resetPassword so that
    // previously-issued JWTs stop working. `tv` on the JWT, token_version
    // on the user row. A missing/mismatched tv ⇒ this token was issued
    // before the last credential change; refuse it.
    if (Number(payload.tv || 0) !== Number(row.token_version || 0)) {
      throw new AuthError('Session no longer valid — please sign in again');
    }

    const user = {
      id: row.id, school_id: row.school_id, email: row.email,
      role: row.role, is_active: row.is_active, token_version: row.token_version
    };
    const school = {
      id: row.s_id, name: row.s_name, slug: row.s_slug,
      email: row.s_email, phone: row.s_phone,
      subscription_plan: row.s_plan, subscription_status: row.s_status,
      subscription_expires_at: row.s_expires_at,
      is_active: row.s_active, is_billing_tenant: row.is_billing_tenant,
      billing_model: row.billing_model, license_tier: row.license_tier,
      billing_ref: row.billing_ref, wallet_balance_cents: row.wallet_balance_cents,
      billing_currency: row.billing_currency, custom_price_cents: row.custom_price_cents
    };

    req.user = user;
    req.school = school;
    // Tag structured logs for the rest of this request with who's calling.
    logger.withContext({ school_id: school.id, user_id: user.id }, () => next());
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticates a machine-to-machine request using an X-API-Key header.
 * Populates req.school but no user. Used for payment & webhook endpoints.
 */
async function authApiKey(req, _res, next) {
  try {
    const key = req.headers['x-api-key'];
    if (!key) throw new AuthError('Missing API key');
    const hash = hashApiKey(key);
    const res = await db.query('SELECT * FROM schools WHERE api_key_hash = $1 AND is_active = TRUE', [hash]);
    const school = res.rows[0];
    if (!school) throw new AuthError('Invalid API key');
    req.school = school;
    req.authVia = 'api_key';
    logger.withContext({ school_id: school.id, auth_via: 'api_key' }, () => next());
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * Accepts either a JWT (user session) or an API key (machine). Both resolve to a school.
 */
function authAny(req, res, next) {
  if (req.headers['x-api-key']) return authApiKey(req, res, next);
  return authJwt(req, res, next);
}

module.exports = { signToken, verifyToken, hashApiKey, authJwt, authApiKey, authAny };
