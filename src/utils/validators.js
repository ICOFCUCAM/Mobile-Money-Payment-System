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

// Minimum password policy. Finance app — err on the strict side without
// demanding a PhD to register.
//   • length ≥ 10 (NIST SP 800-63B's floor is 8; we bump for fintech)
//   • at least 3 of 4 character classes: lower / upper / digit / symbol
//   • not entirely repeated / sequential chars (e.g. 'aaaaaaaaaa', '1234567890')
//   • not in a short list of obvious weak passwords
const COMMON_PASSWORDS = new Set([
  'password1!', 'Password1!', 'Passw0rd!', 'Qwerty123!', 'Welcome1!',
  'Letmein1!', 'Admin1234!', 'Changeme1!', 'iloveyou1!', 'schoolpay1!'
]);

function classesUsed(pw) {
  let n = 0;
  if (/[a-z]/.test(pw)) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

function isTriviallyPatterned(pw) {
  // all same char
  if (/^(.)\1+$/.test(pw)) return true;
  // simple ascending or descending runs of length ≥ 6
  for (let i = 0; i + 5 < pw.length; i++) {
    const chunk = pw.slice(i, i + 6);
    let asc = true, desc = true;
    for (let j = 1; j < chunk.length; j++) {
      if (chunk.charCodeAt(j) !== chunk.charCodeAt(j - 1) + 1) asc = false;
      if (chunk.charCodeAt(j) !== chunk.charCodeAt(j - 1) - 1) desc = false;
    }
    if (asc || desc) return true;
  }
  return false;
}

function assertStrongPassword(pw, { field = 'password' } = {}) {
  if (typeof pw !== 'string') throw new ValidationError(`${field} is required`);
  if (pw.length < 10) throw new ValidationError(`${field} must be at least 10 characters`);
  if (pw.length > 200) throw new ValidationError(`${field} is too long (max 200)`);
  if (classesUsed(pw) < 3) {
    throw new ValidationError(`${field} must mix at least 3 of: lowercase, uppercase, digits, symbols`);
  }
  if (isTriviallyPatterned(pw)) {
    throw new ValidationError(`${field} is too patterned — avoid repeats or simple sequences`);
  }
  if (COMMON_PASSWORDS.has(pw)) {
    throw new ValidationError(`${field} is on the common-passwords blocklist — pick something less guessable`);
  }
}

module.exports = {
  EMAIL_RE,
  SLUG_RE,
  requireFields,
  assertEmail,
  assertSlug,
  assertPositiveInt,
  assertEnum,
  assertStrongPassword
};
