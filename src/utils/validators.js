'use strict';

const { ValidationError } = require('../core/errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

function requireFields(obj, fields) {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (missing.length) throw new ValidationError(`Missing fields: ${missing.join(', ')}`, { missing });
}

function assertEmail(email) {
  if (!EMAIL_RE.test(String(email || ''))) throw new ValidationError('Invalid email');
}

function assertSlug(slug) {
  if (!SLUG_RE.test(String(slug || ''))) throw new ValidationError('Invalid slug (lowercase letters, numbers, hyphens)');
}

function assertPositiveInt(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${name} must be a positive integer`);
  }
  return n;
}

function assertEnum(value, options, name) {
  if (!options.includes(value)) throw new ValidationError(`${name} must be one of: ${options.join(', ')}`);
}

module.exports = {
  EMAIL_RE,
  SLUG_RE,
  requireFields,
  assertEmail,
  assertSlug,
  assertPositiveInt,
  assertEnum
};
