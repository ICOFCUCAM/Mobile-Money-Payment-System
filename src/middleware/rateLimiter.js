'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../core/logger');

/**
 * Rate limiting strategy:
 *   - Production (Vercel / multi-instance): Upstash Redis-backed limits via @upstash/ratelimit.
 *   - Local/dev: in-memory express-rate-limit (per-instance, still useful for smoke tests).
 *
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in the environment to enable Redis.
 */

function makeLocalLimiter({ windowMs, max, keyGenerator, name }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { error: { code: 'RATE_LIMIT', message: `Too many requests (${name})` } }
  });
}

function makeUpstashLimiter({ name, windowSeconds, max, keyFn }) {
  // Lazy-require so the dep isn't needed in dev if unused.
  const { Ratelimit } = require('@upstash/ratelimit');
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    prefix: `rl:${name}`,
    analytics: false
  });
  return async (req, res, next) => {
    try {
      const key = keyFn(req) || req.ip || 'anon';
      const { success, limit, remaining, reset } = await limiter.limit(key);
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset', Math.ceil(reset / 1000));
      if (!success) {
        return res.status(429).json({ error: { code: 'RATE_LIMIT', message: `Too many requests (${name})` } });
      }
      next();
    } catch (err) {
      logger.warn(`Upstash limiter ${name} failed open`, err.message);
      next(); // fail open — never block users on limiter infra failure
    }
  };
}

function buildLimiter(opts) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return makeUpstashLimiter(opts);
  }
  return makeLocalLimiter({
    windowMs: opts.windowSeconds * 1000,
    max: opts.max,
    keyGenerator: opts.keyFn,
    name: opts.name
  });
}

const apiLimiter = buildLimiter({
  name: 'api',
  windowSeconds: Math.max(1, Math.floor(config.rateLimit.windowMs / 1000)),
  max: config.rateLimit.max,
  keyFn: (req) => req.ip
});

const authLimiter = buildLimiter({
  name: 'auth',
  windowSeconds: 15 * 60,
  max: 20,
  keyFn: (req) => `${req.ip}:${(req.body && req.body.email) || ''}`
});

const paymentLimiter = buildLimiter({
  name: 'payments',
  windowSeconds: 60,
  max: 60,
  keyFn: (req) => (req.school && req.school.id) || req.ip
});

module.exports = { apiLimiter, authLimiter, paymentLimiter };
