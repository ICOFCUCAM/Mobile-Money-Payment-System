'use strict';

const { AppError } = require('../core/errors');
const logger = require('../core/logger');

function notFound(_req, res) {
  const trace_id = traceIdOf(res);
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found', trace_id } });
}

// Opt-in debug mode. Set DEBUG_ERRORS=1 to surface error details in responses.
// Off by default — stack traces must not leak to API consumers in production.
const DEBUG_ERRORS = process.env.DEBUG_ERRORS === '1' || process.env.DEBUG_ERRORS === 'true';

/** Pull the current request's trace id off the x-request-id header the
 *  logger middleware set, so clients can include it when reporting issues. */
function traceIdOf(res) {
  try { return res.getHeader('x-request-id') || undefined; } catch (_) { return undefined; }
}

// Postgres error codes we translate into clean HTTP responses instead of an
// opaque 500. Keep the list tight + behaviour-preserving.
const PG_CODE_MAP = {
  '23505': { status: 409, code: 'CONFLICT',       message: 'Resource already exists' },      // unique_violation
  '23503': { status: 409, code: 'FOREIGN_KEY',    message: 'Referenced resource missing' },  // foreign_key_violation
  '23502': { status: 400, code: 'MISSING_FIELD',  message: 'A required field was missing' }, // not_null_violation
  '22P02': { status: 400, code: 'INVALID_INPUT',  message: 'Malformed input' },              // invalid_text_representation
  '57014': { status: 504, code: 'DB_TIMEOUT',     message: 'Database query timed out' }      // query_canceled (statement_timeout)
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const trace_id = traceIdOf(res);

  // Handled application errors — our code threw them on purpose. No
  // ERROR-level log (they're user-facing 4xx, not engineering failures).
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details, trace_id }
    });
  }

  // Well-known Postgres error codes. Render like AppErrors — clean body,
  // no stack trace to the consumer — but still WARN-log so we notice
  // patterns (e.g. a spike of 23505 could mean a broken client).
  if (err && typeof err.code === 'string' && PG_CODE_MAP[err.code]) {
    const m = PG_CODE_MAP[err.code];
    logger.warn(`pg ${err.code} → ${m.code}`, { path: req.path, method: req.method, detail: err.detail });
    return res.status(m.status).json({
      error: { code: m.code, message: m.message, trace_id }
    });
  }

  // Unhandled: genuine engineering failure. The logger forwards Error
  // objects to Sentry with the AsyncLocalStorage request context.
  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);

  const body = {
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', trace_id }
  };
  if (DEBUG_ERRORS) {
    body.error.debug = {
      name: err && err.name,
      message: err && err.message,
      code: err && err.code,
      stack: err && err.stack && err.stack.split('\n').slice(0, 8)
    };
  }
  res.status(500).json(body);
}

module.exports = { notFound, errorHandler };
