'use strict';

const { AppError } = require('../core/errors');
const logger = require('../core/logger');

function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
}

// Opt-in debug mode. Set DEBUG_ERRORS=1 to surface error details in responses.
// Off by default — stack traces must not leak to API consumers in production.
const DEBUG_ERRORS = process.env.DEBUG_ERRORS === '1' || process.env.DEBUG_ERRORS === 'true';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);

  const body = { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
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
