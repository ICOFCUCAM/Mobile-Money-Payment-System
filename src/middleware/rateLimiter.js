'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});

// Stricter limits on auth + payment submission endpoints to curb brute force / abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many attempts, try again later' } }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.school && req.school.id) || req.ip,
  message: { error: { code: 'RATE_LIMIT', message: 'Payment rate limit exceeded' } }
});

module.exports = { apiLimiter, authLimiter, paymentLimiter };
