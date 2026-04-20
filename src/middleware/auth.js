'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { getDb } = require('../core/database');
const { AuthError } = require('../core/errors');

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
function authJwt(req, _res, next) {
  const token = extractBearer(req);
  if (!token) return next(new AuthError('Missing auth token'));
  const payload = verifyToken(token);

  const db = getDb();
  const user = db
    .prepare('SELECT id, school_id, email, role, is_active FROM users WHERE id = ?')
    .get(payload.sub);
  if (!user || !user.is_active) return next(new AuthError('User not found or disabled'));

  const school = db
    .prepare('SELECT * FROM schools WHERE id = ? AND is_active = 1')
    .get(user.school_id);
  if (!school) return next(new AuthError('School not active'));

  req.user = user;
  req.school = school;
  next();
}

/**
 * Authenticates a machine-to-machine request using an X-API-Key header.
 * Populates req.school but no user. Used for payment & webhook endpoints.
 */
function authApiKey(req, _res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return next(new AuthError('Missing API key'));
  const hash = hashApiKey(key);
  const school = getDb()
    .prepare('SELECT * FROM schools WHERE api_key_hash = ? AND is_active = 1')
    .get(hash);
  if (!school) return next(new AuthError('Invalid API key'));
  req.school = school;
  req.authVia = 'api_key';
  next();
}

/**
 * Accepts either a JWT (user session) or an API key (machine). Both resolve to a school.
 */
function authAny(req, res, next) {
  if (req.headers['x-api-key']) return authApiKey(req, res, next);
  return authJwt(req, res, next);
}

module.exports = { signToken, verifyToken, hashApiKey, authJwt, authApiKey, authAny };
