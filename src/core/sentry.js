'use strict';

/**
 * Sentry wrapper — opt-in via the SENTRY_DSN env var.
 *
 * If SENTRY_DSN is not set (local dev, smoke tests, preview environments
 * without telemetry, etc.), every exported function is a cheap no-op.
 * That means we can sprinkle captureException / setUser / setTag calls
 * anywhere in the codebase without worrying about whether Sentry is on.
 *
 * The init is lazy + idempotent — the first call to any wrapper function
 * bootstraps the SDK; subsequent calls reuse the initialized client.
 */

const logger = require('./logger');

let sentry = null;      // the @sentry/node module once initialised
let initialised = false;
let enabled = false;

function init() {
  if (initialised) return enabled;
  initialised = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  try {
    sentry = require('@sentry/node');
    sentry.init({
      dsn,
      environment:
        process.env.SENTRY_ENV ||
        process.env.VERCEL_ENV ||
        process.env.NODE_ENV ||
        'development',
      release:
        process.env.SENTRY_RELEASE ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        undefined,
      // Start conservative on volume — errors only, no perf tracing yet.
      // Can flip tracesSampleRate later when cost is understood.
      tracesSampleRate: 0,
      // 401/404 aren't engineering problems; don't burn the quota on them.
      beforeSend(event) {
        const httpStatus = event && event.contexts && event.contexts.response && event.contexts.response.status_code;
        if (httpStatus === 401 || httpStatus === 404) return null;
        return event;
      }
    });
    enabled = true;
    logger.info('Sentry initialised', { environment: process.env.VERCEL_ENV || process.env.NODE_ENV });
    return true;
  } catch (err) {
    logger.warn('Sentry init failed — continuing without telemetry', err && err.message);
    sentry = null;
    enabled = false;
    return false;
  }
}

/** Capture an exception with optional context. Safe to call if Sentry is off. */
function captureException(err, ctx) {
  if (!init() || !sentry) return;
  try {
    sentry.withScope((scope) => {
      if (ctx) {
        if (ctx.trace_id)  scope.setTag('trace_id', ctx.trace_id);
        if (ctx.school_id) scope.setTag('school_id', ctx.school_id);
        if (ctx.user_id)   scope.setUser({ id: ctx.user_id });
        if (ctx.path)      scope.setTag('path', ctx.path);
        if (ctx.action)    scope.setTag('action', ctx.action);
        if (ctx.extra)     scope.setContext('extra', ctx.extra);
      }
      sentry.captureException(err);
    });
  } catch (_) { /* never let Sentry break the app */ }
}

/** Express middleware: catches thrown errors, forwards to Sentry, calls next(err). */
function expressErrorHandler(err, _req, _res, next) {
  captureException(err);
  next(err);
}

/** Fire-and-forget breadcrumb — useful for "what was happening before the crash" logs. */
function addBreadcrumb(crumb) {
  if (!init() || !sentry) return;
  try { sentry.addBreadcrumb(crumb); } catch (_) {}
}

module.exports = { init, captureException, expressErrorHandler, addBreadcrumb, get enabled() { return enabled; } };
