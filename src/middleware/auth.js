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

    const userRes = await db.query(
      'SELECT id, school_id, email, role, is_active, token_version FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = userRes.rows[0];
    if (!user || !user.is_active) throw new AuthError('User not found or disabled');
    // Token version gate: bumped by changePassword / resetPassword so that
    // previously-issued JWTs stop working. `tv` on the JWT, token_version
    // on the user row. A missing/mismatched tv ⇒ this token was issued
    // before the last credential change; refuse it.
    if (Number(payload.tv || 0) !== Number(user.token_version || 0)) {
      throw new AuthError('Session no longer valid — please sign in again');
    }

    const schoolRes = await db.query('SELECT * FROM schools WHERE id = $1 AND is_active = TRUE', [user.school_id]);
    const school = schoolRes.rows[0];
    if (!school) throw new AuthError('School not active');

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
