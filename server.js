'use strict';

require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/core/logger');
const { initDatabase, getPool } = require('./src/core/database');

async function start() {
  await initDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`School Payment SaaS listening on :${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      try { await getPool().end(); } catch (_) { /* ignore */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  const sentry = require('./src/core/sentry');
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    try { sentry.captureException(err, { action: 'unhandledRejection' }); } catch (_) {}
    logger.error('UnhandledRejection', err);
  });
  process.on('uncaughtException', (err) => {
    try { sentry.captureException(err, { action: 'uncaughtException' }); } catch (_) {}
    logger.error('UncaughtException', err);
  });
}

start().catch((err) => {
  logger.error('Failed to start', err);
  process.exit(1);
});
