'use strict';

// Entry point for Vercel serverless functions.
// `vercel.json` routes every incoming request (including /webhooks/*) here.
// The schema is ensured lazily on the first DB call (see src/core/database.js).

require('dotenv').config();

const logger = require('../src/core/logger');
const sentry = require('../src/core/sentry');

// Process-level safety net for the serverless runtime. Vercel will recycle
// a lambda that throws an unhandled rejection or exception anyway — but we
// want a log line + Sentry capture BEFORE the process dies, otherwise the
// incident surfaces only as a platform-level 500 with no app context.
if (!globalThis.__schoolpay_process_handlers_installed__) {
  globalThis.__schoolpay_process_handlers_installed__ = true;
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    try { sentry.captureException(err, { action: 'unhandledRejection' }); } catch (_) {}
    logger.error('UnhandledRejection', err);
  });
  process.on('uncaughtException', (err) => {
    try { sentry.captureException(err, { action: 'uncaughtException' }); } catch (_) {}
    logger.error('UncaughtException', err);
    // Don't exit — Vercel handles lambda recycling. Forcing an exit here
    // truncates in-flight requests for no benefit.
  });
}

const app = require('../src/app');

module.exports = app;
