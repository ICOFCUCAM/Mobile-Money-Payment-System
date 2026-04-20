'use strict';

const { AppError } = require('../core/errors');
const logger = require('../core/logger');

function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

module.exports = { notFound, errorHandler };
