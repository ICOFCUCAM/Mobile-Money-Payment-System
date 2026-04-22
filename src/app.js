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

app.use(
  helmet({
    contentSecurityPolicy: false // Allow inline scripts in the static dashboard
  })
);
app.use(cors({ origin: true, credentials: true }));
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

// School-website integration endpoints (Bearer API key)
app.use('/api/public', publicRoutes);

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
