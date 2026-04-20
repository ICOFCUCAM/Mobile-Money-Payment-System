'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config');
const logger = require('./core/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const schoolsRoutes = require('./modules/schools/schools.routes');
const authRoutes = require('./modules/auth/auth.routes');
const studentsRoutes = require('./modules/students/students.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

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
app.use(
  morgan(config.isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  })
);

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

// Temporary diagnostic endpoint — reports DB connectivity + schema presence.
// Remove once deployment is healthy.
app.get('/api/_diag', async (_req, res) => {
  const { db } = require('./core/database');
  const dbUrl = process.env.DATABASE_URL || '';
  const host = (dbUrl.match(/@([^:/?]+)/) || [])[1] || null;
  const port = (dbUrl.match(/:(\d+)\//) || [])[1] || null;
  const result = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      has_ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      has_JWT_SECRET: !!process.env.JWT_SECRET,
      db_host: host,
      db_port: port
    }
  };
  try {
    const r = await db.query('SELECT 1 AS ok');
    result.query = { ok: true, rows: r.rows };
    const tables = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    result.tables = tables.rows.map((t) => t.table_name);
    res.json(result);
  } catch (err) {
    result.query = {
      ok: false,
      name: err && err.name,
      code: err && err.code,
      message: err && err.message,
      stack: err && err.stack && err.stack.split('\n').slice(0, 10)
    };
    res.status(500).json(result);
  }
});

app.use('/api', apiLimiter);

// Public / semi-public API
app.use('/api/schools', schoolsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// Tenant-scoped API (school is resolved from JWT or API key)
app.use('/api/students', studentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Provider webhooks — unauthenticated at the HTTP layer; integrity is enforced
// via provider-specific signature checks inside the handler.
app.use('/webhooks', webhooksRoutes);

// Static dashboard (served at /)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
