'use strict';

/**
 * Boot-time environment validation. Runs from src/app.js so a
 * misconfigured deploy fails at import time instead of producing
 * mysterious runtime errors (or worse, running with dev-only defaults
 * in production).
 *
 * Rules:
 *   - Non-production: warn on issues, don't throw.
 *   - Production: throw on any hard failure (missing critical secret,
 *     dev-default in use for anything security-sensitive).
 *
 * The `config` module already runs at require-time and fills in dev
 * fallbacks; this module detects those fallbacks and refuses to
 * continue if we're in production mode.
 */

const DEV_MARKERS = [
  'dev_only_encryption_key_change_me_in_production_32b',
  'dev_only_jwt_secret_change_me_in_production',
  'dev_webhook_secret'
];

const REQUIRED_IN_PROD = [
  { name: 'DATABASE_URL',    why: 'no DB means no persistence' },
  { name: 'JWT_SECRET',      why: 'tokens would be trivially forgeable' },
  { name: 'ENCRYPTION_KEY',  why: 'provider credentials at rest would be readable' }
];

const RECOMMENDED = [
  { name: 'SENTRY_DSN',      why: 'errors will not be reported anywhere external' },
  { name: 'CLEANUP_TOKEN',   why: '/api/_cleanup disabled — unbounded table growth' },
  { name: 'CORS_ORIGINS',    why: 'no allowlist means only localhost origins are trusted' },
  { name: 'RESEND_API_KEY',  why: 'transactional emails will log-only, not send' }
];

function validateEnv({ throwOnError = undefined, logger = console } = {}) {
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';
  const shouldThrow = throwOnError ?? isProd;

  const hardErrors = [];
  const warnings = [];

  for (const { name, why } of REQUIRED_IN_PROD) {
    const v = process.env[name];
    if (!v || !String(v).trim()) {
      const msg = `[env] ${name} is not set — ${why}`;
      if (isProd) hardErrors.push(msg);
      else warnings.push(msg);
    }
  }

  // Detect dev fallbacks leaking into production.
  if (isProd) {
    if (DEV_MARKERS.includes(process.env.JWT_SECRET)) {
      hardErrors.push('[env] JWT_SECRET is set to the development default — set a real secret');
    }
    if (DEV_MARKERS.includes(process.env.ENCRYPTION_KEY)) {
      hardErrors.push('[env] ENCRYPTION_KEY is set to the development default — set a real 32-byte key');
    }
  }

  // Encryption key length (AES-256 → 32 bytes). Accepts raw, hex, or base64.
  if (process.env.ENCRYPTION_KEY) {
    const keyBytes = detectKeyBytes(process.env.ENCRYPTION_KEY);
    if (keyBytes !== null && keyBytes !== 32) {
      const msg = `[env] ENCRYPTION_KEY decodes to ${keyBytes} bytes; AES-256 needs 32`;
      if (isProd) hardErrors.push(msg);
      else warnings.push(msg);
    }
  }

  for (const { name, why } of RECOMMENDED) {
    if (!process.env[name] || !String(process.env[name]).trim()) {
      warnings.push(`[env] ${name} not set — ${why}`);
    }
  }

  for (const w of warnings) {
    if (logger && typeof logger.warn === 'function') logger.warn(w);
  }
  if (hardErrors.length) {
    for (const e of hardErrors) {
      if (logger && typeof logger.error === 'function') logger.error(e);
    }
    if (shouldThrow) {
      throw new Error(
        `Environment validation failed (${hardErrors.length} error${hardErrors.length === 1 ? '' : 's'}). ` +
        'Set the missing vars in your deployment config.'
      );
    }
  }

  return { hardErrors, warnings, isProd };
}

/** Try to parse a key as raw, hex, or base64 and return its byte length. */
function detectKeyBytes(str) {
  // Hex
  if (/^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0) {
    return str.length / 2;
  }
  // Base64
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(str) && str.length % 4 === 0) {
    try { return Buffer.from(str, 'base64').length; } catch (_) {}
  }
  // Raw
  return Buffer.byteLength(str, 'utf8');
}

module.exports = { validateEnv };
