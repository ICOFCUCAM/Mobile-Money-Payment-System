'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');
const logger = require('./core/logger');
const sentry = require('./core/sentry');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Boot Sentry eagerly so the very first exception is captured. No-op if
// SENTRY_DSN is unset.
sentry.init();

const schoolsRoutes = require('./modules/schools/schools.routes');
const authRoutes = require('./modules/auth/auth.routes');
const studentsRoutes = require('./modules/students/students.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const publicRoutes = require('./modules/public/public.routes');
const billingRoutes = require('./modules/billing/billing.routes');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Content-Security-Policy. Tight defaults: only same-origin scripts/styles,
// no inline script (the legacy /public dashboard uses addEventListener +
// innerHTML template rendering, never inline handlers, so this is safe).
// Data-URIs allowed for img-src so the QR code the 2FA flow generates
// renders. object-src 'none' and frame-ancestors 'none' block plugin
// content and clickjacking respectively.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src':     ["'self'"],
        'script-src':      ["'self'"],
        'script-src-attr': ["'none'"],
        'style-src':       ["'self'", "'unsafe-inline'"],
        'img-src':         ["'self'", 'data:'],
        'connect-src':     ["'self'"],
        'font-src':        ["'self'", 'data:'],
        'object-src':      ["'none'"],
        'base-uri':        ["'self'"],
        'form-action':     ["'self'"],
        'frame-ancestors': ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // don't force COEP on consumers
    crossOriginResourcePolicy: { policy: 'cross-origin' } // API is cross-origin-fetched by the SPA
  })
);
// CORS. Two profiles:
//   - default (for the dashboard / API)  → allowlist via CORS_ORIGINS env,
//       credentials allowed. Blocks arbitrary sites from making authenticated
//       cross-origin requests on behalf of a logged-in user.
//   - /api/public/*                      → permissive, no credentials. School
//       websites embed these endpoints; the API key in the Bearer header is
//       the authentication, not any session cookie.
//
// CORS_ORIGINS is comma-separated: "https://app.schoolpay.com,https://schoolpay.com"
// Unset ⇒ same-origin + localhost only (safe default for dev / first deploy).
const parseAllowlist = (env) =>
  String(env || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = parseAllowlist(process.env.CORS_ORIGINS);
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originAllowed(origin) {
  if (!origin) return true; // same-origin / server-to-server
  if (LOCALHOST_RE.test(origin)) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (originAllowed(origin)) return cb(null, true);
      return cb(null, false); // false, not an error — browser will drop the response
    },
    credentials: true
  })
);
// Permissive CORS for the public integration endpoints (Bearer API key auth,
// no cookies). Applied at the router mount point below.
const publicCors = cors({ origin: '*', credentials: false });
app.use(cookieParser());

// Structured request logging. Generates a trace_id per request, exposes it as
// the `x-request-id` response header, and binds it (plus school_id/user_id
// once auth runs) via AsyncLocalStorage so every downstream logger.* call
// includes it automatically. Replaces the morgan access-log we had before.
app.use(logger.requestLogger);

// Capture raw body into req.rawBody so webhooks can verify provider signatures.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  })
);
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Retention sweeper. Protected by a shared secret in CLEANUP_TOKEN.
// Accepts the token via any of: `Authorization: Bearer <token>` (Vercel
// crons use this), `X-Cleanup-Token`, or `?token=` query param. Returns
// per-table delete counts for observability.
//
// To wire a Vercel cron, add this to vercel.json:
//   "crons": [{ "path": "/api/_cleanup", "schedule": "0 3 * * *" }]
// and set CLEANUP_TOKEN in project settings (Vercel passes it as Bearer).
app.all('/api/_cleanup', async (req, res, next) => {
  try {
    const expected = process.env.CLEANUP_TOKEN;
    if (!expected) {
      return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'CLEANUP_TOKEN is not set' } });
    }
    const auth = req.headers.authorization || '';
    const bearer = /^Bearer\s+(.+)$/i.exec(auth);
    const supplied = (bearer && bearer[1]) || req.headers['x-cleanup-token'] || req.query.token;
    if (supplied !== expected) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'invalid or missing cleanup token' } });
    }
    const { getPool } = require('./core/database');
    const { runCleanup } = require('./core/cleanup');
    const result = await runCleanup(getPool());
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
});

// Readiness probe with a DB ping. Surfaces the real error only when DEBUG_ERRORS=1.
app.get('/api/_status', async (_req, res) => {
  const { db } = require('./core/database');
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'ok', uptime: process.uptime() });
  } catch (err) {
    const debug = process.env.DEBUG_ERRORS === '1' || process.env.DEBUG_ERRORS === 'true';
    res.status(503).json({
      ok: false,
      db: 'error',
      error: debug ? { name: err.name, code: err.code, message: err.message } : 'unavailable'
    });
  }
});

app.use('/api', apiLimiter);

// Public / semi-public API
app.use('/api/schools', schoolsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// School-website integration endpoints (Bearer API key). Permissive CORS:
// API key is the authentication; there's no cookie/session to protect.
app.use('/api/public', publicCors, publicRoutes);

// Tenant-scoped API (school is resolved from JWT or API key)
app.use('/api/students', studentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);

// Provider webhooks — unauthenticated at the HTTP layer; integrity is enforced
// via provider-specific signature checks inside the handler.
app.use('/webhooks', webhooksRoutes);

// Static dashboard (served at /)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(notFound);
// Sentry first so exceptions are captured with full context, then our
// JSON-formatted error handler renders the response.
app.use(sentry.expressErrorHandler);
app.use(errorHandler);

module.exports = app;
