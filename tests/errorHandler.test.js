'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const express = require('express');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');
const logger = require('../src/core/logger');
const {
  AppError, ValidationError, AuthError, NotFoundError, ConflictError
} = require('../src/core/errors');

/** Spin up a tiny express app around errorHandler, capture a response for `path`. */
function probe(path, injectError) {
  return new Promise((resolve) => {
    const app = express();
    app.use(logger.requestLogger); // sets x-request-id
    app.get(path, (_req, _res, next) => next(injectError));
    app.use(notFound);
    app.use(errorHandler);

    const server = app.listen(0, () => {
      const port = server.address().port;
      const http = require('http');
      http.get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => { server.close(); resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }); });
      });
    });
  });
}

test('AppError subclass renders with its code + status', async () => {
  const { status, body } = await probe('/x', new ValidationError('bad input'));
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'bad input');
  assert.ok(body.error.trace_id);
});

test('AuthError → 401', async () => {
  const { status, body } = await probe('/x', new AuthError('nope'));
  assert.equal(status, 401);
  assert.equal(body.error.code, 'AUTH_ERROR');
});

test('NotFoundError → 404 with its own message', async () => {
  const { status, body } = await probe('/x', new NotFoundError('gone'));
  assert.equal(status, 404);
  assert.equal(body.error.message, 'gone');
});

test('ConflictError → 409', async () => {
  const { status, body } = await probe('/x', new ConflictError('dup'));
  assert.equal(status, 409);
  assert.equal(body.error.code, 'CONFLICT');
});

test('unknown Error falls through to 500 with INTERNAL_ERROR', async () => {
  const { status, body } = await probe('/x', new Error('boom'));
  assert.equal(status, 500);
  assert.equal(body.error.code, 'INTERNAL_ERROR');
  assert.equal(body.error.message, 'Internal server error');
  assert.ok(body.error.trace_id);
});

test('pg unique_violation (23505) maps to 409 CONFLICT', async () => {
  const e = Object.assign(new Error('duplicate key'), { code: '23505' });
  const { status, body } = await probe('/x', e);
  assert.equal(status, 409);
  assert.equal(body.error.code, 'CONFLICT');
});

test('pg check_violation (23514) maps to 400 INVALID_INPUT', async () => {
  const e = Object.assign(new Error('check failed'), { code: '23514' });
  const { status, body } = await probe('/x', e);
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_INPUT');
});

test('pg query_canceled (57014) maps to 504 DB_TIMEOUT', async () => {
  const e = Object.assign(new Error('canceled'), { code: '57014' });
  const { status, body } = await probe('/x', e);
  assert.equal(status, 504);
  assert.equal(body.error.code, 'DB_TIMEOUT');
});

test('genuine 404 path carries trace_id in body', async () => {
  // Build a second app with no matching route.
  const app = express();
  app.use(logger.requestLogger);
  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const http = require('http');
      http.get({ host: '127.0.0.1', port, path: '/truly-missing' }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          server.close();
          const parsed = JSON.parse(body);
          assert.equal(res.statusCode, 404);
          assert.equal(parsed.error.code, 'NOT_FOUND');
          assert.ok(parsed.error.trace_id);
          resolve();
        });
      });
    });
  });
});
