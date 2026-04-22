'use strict';

const crypto = require('crypto');
const otp = require('otplib');
const QRCode = require('qrcode');
const { db, writeAudit } = require('../../core/database');
const { encrypt, decrypt } = require('../../core/encryption');
const { AuthError, ValidationError, NotFoundError } = require('../../core/errors');

// otplib v13 functional API. 6-digit TOTP, 30s period, ±1 step drift for
// clock skew (so a code is valid within a 90-second window).
const TOTP_OPTS = { digits: 6, period: 30, algorithm: 'sha1', window: 1 };
function totpGenerate(secret)         { return otp.generateSync({ secret, ...TOTP_OPTS }); }
function totpVerify(secret, token) {
  // otplib v13 returns { valid, delta, ... } — unwrap to a boolean.
  const r = otp.verifySync({ secret, token, ...TOTP_OPTS });
  return !!(r && r.valid);
}
function totpGenerateSecret()         { return otp.generateSecret(); }
function totpUri(secret, label, issuer) {
  return otp.generateURI({ secret, label, issuer, ...TOTP_OPTS });
}

/**
 * Start enrolling a user in TOTP.
 *
 *   1. Generate a fresh secret (stored in totp_setups, 15min TTL).
 *   2. Build an otpauth:// URI so authenticator apps can consume a QR code.
 *   3. Return { qrDataUrl, secret, issuer } — client displays the QR, user
 *      scans, then confirms with a code via /auth/2fa/confirm.
 *
 * Calling setup again overwrites any pending un-confirmed setup, so a user
 * can retry without cleanup.
 */
async function startSetup(user) {
  if (!user) throw new AuthError('Not authenticated');
  const secret = totpGenerateSecret();
  const issuer = 'SchoolPay';
  const label = user.email;
  const otpauthUri = totpUri(secret, label, issuer);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri);

  await db.query(
    `INSERT INTO totp_setups (user_id, secret)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET secret = EXCLUDED.secret, created_at = NOW(),
                                          expires_at = NOW() + INTERVAL '15 minutes'`,
    [user.id, encrypt(secret)]
  );

  return { qrDataUrl, secret, otpauthUri, issuer, label };
}

/**
 * Finalise TOTP enrollment by confirming the user can compute a valid code.
 * Stores the secret permanently on users.totp_secret + generates 10 backup
 * codes the user must save (SHA-256 hashed server-side, newline-separated).
 */
async function confirmSetup(user, code) {
  if (!user) throw new AuthError('Not authenticated');
  if (!code || typeof code !== 'string') throw new ValidationError('A 6-digit code is required');

  const pending = await db.query('SELECT secret, expires_at FROM totp_setups WHERE user_id = $1', [user.id]);
  if (!pending.rows[0]) throw new ValidationError('No 2FA setup in progress — start over from Settings');
  if (new Date(pending.rows[0].expires_at) < new Date()) {
    throw new ValidationError('Setup expired. Please start over.');
  }
  const secret = decrypt(pending.rows[0].secret);

  if (!totpVerify(secret, code.trim())) {
    throw new ValidationError('Code did not match. Make sure the phone clock is correct.');
  }

  const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
  const hashed = backupCodes.map((c) => crypto.createHash('sha256').update(c).digest('hex')).join('\n');

  await db.withTransaction(async (client) => {
    await client.query(
      `UPDATE users SET totp_secret = $1, totp_enabled_at = NOW(), totp_backup_codes = $2 WHERE id = $3`,
      [encrypt(secret), hashed, user.id]
    );
    await client.query(`DELETE FROM totp_setups WHERE user_id = $1`, [user.id]);
  });

  writeAudit({
    schoolId: user.school_id, userId: user.id,
    action: '2fa.enabled', entity: 'user', entityId: user.id
  });

  return { enabled: true, backupCodes };
}

/**
 * Verify a TOTP code (or a backup code) during login. Consuming a backup
 * code removes it from the list.
 */
async function verifyCode(user, code) {
  if (!user || !user.totp_secret) return false;
  if (!code) return false;
  const clean = String(code).replace(/\s+/g, '').toUpperCase();

  // Backup-code path: 10 hex chars
  if (/^[0-9A-F]{10}$/.test(clean)) {
    const stored = (user.totp_backup_codes || '').split('\n').filter(Boolean);
    const attemptHash = crypto.createHash('sha256').update(clean).digest('hex');
    const idx = stored.indexOf(attemptHash);
    if (idx === -1) return false;
    // Consume the backup code
    stored.splice(idx, 1);
    await db.query('UPDATE users SET totp_backup_codes = $1 WHERE id = $2', [stored.join('\n'), user.id]);
    writeAudit({
      schoolId: user.school_id, userId: user.id,
      action: '2fa.backup_code_used', metadata: { remaining: stored.length }
    });
    return true;
  }

  // Regular TOTP path
  try {
    const secret = decrypt(user.totp_secret);
    return totpVerify(secret, clean);
  } catch (_) {
    return false;
  }
}

/** Disable 2FA. Requires the user to have just verified a current code. */
async function disable(user, code) {
  if (!user) throw new AuthError('Not authenticated');
  if (!user.totp_secret) throw new ValidationError('2FA is not enabled');
  if (!(await verifyCode(user, code))) {
    throw new AuthError('Current 2FA code required to disable');
  }
  await db.query(
    `UPDATE users SET totp_secret = NULL, totp_enabled_at = NULL, totp_backup_codes = NULL WHERE id = $1`,
    [user.id]
  );
  writeAudit({
    schoolId: user.school_id, userId: user.id,
    action: '2fa.disabled', entity: 'user', entityId: user.id
  });
  return { enabled: false };
}

/**
 * Policy: anyone in the schoolpay-billing tenant must have 2FA on.
 * Call this from login — reject with a 412 if the account needs to enroll.
 */
function isRequiredFor(user) {
  return user && user.school_id === 'schoolpay-billing' && user.role === 'admin';
}

module.exports = { startSetup, confirmSetup, verifyCode, disable, isRequiredFor };
