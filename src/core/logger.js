'use strict';

/**
 * Structured JSON logger with per-request context.
 *
 * Every log line is a single JSON object on one line — easy to grep, easy to
 * ingest into Datadog / Logflare / Axiom / CloudWatch / any log aggregator
 * that looks for JSON.
 *
 * Shape:
 *   { ts, level, msg, trace_id?, school_id?, user_id?, action?, duration_ms?,
 *     err?: { name, message, stack }, ...extra }
 *
 * Usage stays the same as before — existing call-sites don't need changes:
 *   logger.info('User created', { userId })                 // string + object
 *   logger.error('DB failed', err)                          // Error instance
 *   logger.warn('Provider degraded', 'MTN', { status: 503 }) // mixed args
 *
 * Per-request context is attached via AsyncLocalStorage so middleware can set
 * { trace_id, school_id, user_id } once and every logger.* call in the request
 * pipeline picks them up automatically. In dev we pretty-print; in prod we
 * emit compact JSON.
 */

const { AsyncLocalStorage } = require('async_hooks');

const ctxStore = new AsyncLocalStorage();
const PRETTY = process.env.NODE_ENV !== 'production' && !process.env.LOG_JSON;

function mergeArgs(args) {
  // Accept any mix of strings, objects, Errors, numbers. Concat strings for
  // the `msg` field; merge object fields into the root; extract Error stack.
  const msgParts = [];
  const extra = {};
  let err;
  for (const a of args) {
    if (a instanceof Error) {
      err = { name: a.name, message: a.message, stack: a.stack };
      msgParts.push(a.message);
    } else if (a && typeof a === 'object') {
      Object.assign(extra, a);
    } else if (a != null) {
      msgParts.push(String(a));
    }
  }
  const out = { msg: msgParts.join(' ') || undefined, ...extra };
  if (err) out.err = err;
  return out;
}

function emit(level, args) {
  const ctx = ctxStore.getStore() || {};
  const line = {
    ts: new Date().toISOString(),
    level,
    ...ctx,
    ...mergeArgs(args)
  };

  if (PRETTY) {
    // Dev: one-line readable.
    const parts = [
      `[${line.ts}]`,
      `[${level}]`,
      line.trace_id && `(${String(line.trace_id).slice(0, 8)})`,
      line.school_id && `[${line.school_id}]`,
      line.msg,
      line.err && `\n${line.err.stack}`
    ].filter(Boolean);
    const write = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    write(parts.join(' '));
    return;
  }

  // Prod: one compact JSON line per entry.
  const write = level === 'ERROR' ? console.error : console.log;
  write(JSON.stringify(line));
}

/**
 * Bind context for the current async scope. Anything logged inside the
 * callback (including inside awaited Promises) picks up `ctx` automatically.
 */
function withContext(ctx, fn) {
  const current = ctxStore.getStore() || {};
  return ctxStore.run({ ...current, ...ctx }, fn);
}

/**
 * Express middleware. Generates a trace_id per request, binds it + whatever
 * auth context is already on the request, and logs an access line when the
 * response finishes.
 */
function requestLogger(req, res, next) {
  const crypto = require('crypto');
  const trace_id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', trace_id);
  const started = Date.now();

  const ctx = {
    trace_id,
    school_id: req.school && req.school.id,
    user_id:   req.user && req.user.id,
    method:    req.method,
    path:      req.originalUrl || req.url
  };

  ctxStore.run(ctx, () => {
    res.on('finish', () => {
      emit('INFO', [{
        msg: 'request',
        status: res.statusCode,
        duration_ms: Date.now() - started
      }]);
    });
    next();
  });
}

module.exports = {
  info:  (...args) => emit('INFO',  args),
  warn:  (...args) => emit('WARN',  args),
  error: (...args) => emit('ERROR', args),
  debug: (...args) => { if (process.env.DEBUG) emit('DEBUG', args); },
  withContext,
  requestLogger
};
