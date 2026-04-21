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
  process.on('unhandledRejection', (err) => logger.error('UnhandledRejection', err));
  process.on('uncaughtException', (err) => logger.error('UncaughtException', err));
}

start().catch((err) => {
  logger.error('Failed to start', err);
  process.exit(1);
});
