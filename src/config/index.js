'use strict';

const path = require('path');

const env = process.env.NODE_ENV || 'development';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = Object.freeze({
  env,
  isProd: env === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db')
  },

  security: {
    encryptionKey: required('ENCRYPTION_KEY', 'dev_only_encryption_key_change_me_in_production_32b'),
    jwtSecret: required('JWT_SECRET', 'dev_only_jwt_secret_change_me_in_production'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: 12,
    webhookSecret: process.env.WEBHOOK_SHARED_SECRET || 'dev_webhook_secret'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10)
  },

  providers: {
    mtn: {
      baseUrl: process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
    },
    orange: {
      baseUrl: process.env.ORANGE_BASE_URL || 'https://api.orange.com/orange-money-webpay'
    }
  }
});

module.exports = config;
