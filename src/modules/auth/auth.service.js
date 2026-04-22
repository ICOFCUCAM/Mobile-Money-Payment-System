'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
const { signToken } = require('../../middleware/auth');
const { AuthError, ConflictError, NotFoundError, ValidationError } = require('../../core/errors');
const { assertEmail, assertEnum, requireFields } = require('../../utils/validators');
const config = require('../../config');
const logger = require('../../core/logger');

const ROLES = ['admin', 'bursar', 'auditor'];

async function login({ email, password, schoolSlug, totp }, ip) {
  requireFields({ email, password }, ['email', 'password']);
  const emailLc = String(email).toLowerCase();

  let schoolRes;
  if (schoolSlug) {
    schoolRes = await db.query('SELECT * FROM schools WHERE slug = $1 AND is_active = TRUE', [schoolSlug]);
  } else {
    schoolRes = await db.query(
      `SELECT s.* FROM schools s
       JOIN users u ON u.school_id = s.id
       WHERE u.email = $1 AND s.is_active = TRUE
       LIMIT 1`,
      [emailLc]
    );
  }
  const school = schoolRes.rows[0];
  if (!school) throw new AuthError('Invalid credentials');

  const userRes = await db.query(
    'SELECT * FROM users WHERE school_id = $1 AND email = $2 AND is_active = TRUE',
    [school.id, emailLc]
  );
  const user = userRes.rows[0];
  if (!user) throw new AuthError('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AuthError('Invalid credentials');

  // 2FA gate. Belt-and-braces — wrap the require in a try so a missing
  // dep (otplib/qrcode) doesn't take out every login.
  let twofa = null;
  try { twofa = require('./twofa.service'); }
  catch (e) { logger.warn(`2FA module failed to load (${e.message}); proceeding without 2FA check`); }

  const mustHave2fa = twofa ? twofa.isRequiredFor(user) : false;
  let mustEnroll2fa = false;
  if (twofa && user.totp_secret) {
    if (!totp) return { requires2fa: 'verify' };
    if (!(await twofa.verifyCode(user, totp))) {
      writeAudit({ schoolId: school.id, userId: user.id, action: 'auth.2fa_failed', ip });
      throw new AuthError('Invalid 2FA code');
    }
  } else if (mustHave2fa) {
    mustEnroll2fa = true;
  }

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  writeAudit({ schoolId: school.id, userId: user.id, action: 'auth.login', ip });

  const token = signToken({ sub: user.id, school_id: school.id, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name,
            twofa_enabled: !!user.totp_secret, must_enroll_2fa: mustEnroll2fa },
    school: { id: school.id, slug: school.slug, name: school.name, plan: school.subscription_plan }
  };
}

async function createUser(schoolId, payload, actor, ip) {
  requireFields(payload, ['email', 'password', 'role', 'fullName']);
  assertEmail(payload.email);
  assertEnum(payload.role, ROLES, 'role');
  if (payload.password.length < 8) throw new ValidationError('Password must be at least 8 characters');

  const emailLc = payload.email.toLowerCase();
  const existing = await db.query(
    'SELECT id FROM users WHERE school_id = $1 AND email = $2',
    [schoolId, emailLc]
  );
  if (existing.rows.length) throw new ConflictError('User with that email already exists');

  const passwordHash = await bcrypt.hash(payload.password, config.security.bcryptRounds);
  const id = uuid();
  await db.query(
    `INSERT INTO users (id, school_id, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, schoolId, emailLc, passwordHash, payload.fullName, payload.role]
  );

  writeAudit({
    schoolId,
    userId: actor && actor.id,
    action: 'user.create',
    entity: 'user',
    entityId: id,
    metadata: { role: payload.role },
    ip
  });

  return { id, email: emailLc, role: payload.role, fullName: payload.fullName };
}

async function listUsers(schoolId) {
  const res = await db.query(
    'SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM users WHERE school_id = $1',
    [schoolId]
  );
  return res.rows;
}

function hashToken(tok) {
  return crypto.createHash('sha256').update(tok).digest('hex');
}

/**
 * Start a password reset. Always returns ok — never leaks whether the account exists.
 * The plaintext token is returned only in dev (when no mail service is wired) so the
 * caller can surface it in the response for testing. In production, integrate with
 * SendGrid/Postmark/etc. and remove the token from the response body.
 */
async function requestPasswordReset({ email, schoolSlug }, ip) {
  requireFields({ email }, ['email']);
  const emailLc = String(email).toLowerCase();

  let userRes;
  if (schoolSlug) {
    userRes = await db.query(
      `SELECT u.* FROM users u
       JOIN schools s ON s.id = u.school_id
       WHERE u.email = $1 AND s.slug = $2 AND u.is_active = TRUE AND s.is_active = TRUE`,
      [emailLc, schoolSlug]
    );
  } else {
    userRes = await db.query(
      `SELECT u.* FROM users u
       JOIN schools s ON s.id = u.school_id
       WHERE u.email = $1 AND u.is_active = TRUE AND s.is_active = TRUE
       LIMIT 1`,
      [emailLc]
    );
  }
  const user = userRes.rows[0];

  // Always return ok — don't leak whether the account exists.
  if (!user) return { ok: true };

  // Invalidate any prior unused tokens for this user.
  await db.query(
    `UPDATE password_resets SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  const token = `prt_${crypto.randomBytes(24).toString('hex')}`;
  const id = uuid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.query(
    `INSERT INTO password_resets (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, user.id, hashToken(token), expiresAt]
  );

  writeAudit({
    schoolId: user.school_id,
    userId: user.id,
    action: 'auth.request_password_reset',
    entity: 'password_reset',
    entityId: id,
    ip
  });

  logger.info(`Password reset token issued for ${emailLc} (expires ${expiresAt.toISOString()})`);

  // Dispatch via Resend. Log-only when RESEND_API_KEY is unset — the
  // plaintext token is then also returned in the response if
  // PASSWORD_RESET_EXPOSE_TOKEN=1 (dev/smoke tests only).
  const appUrl = process.env.APP_URL || process.env.VERCEL_URL || '';
  const base = appUrl.startsWith('http') ? appUrl : (appUrl ? `https://${appUrl}` : '');
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
  const schoolRes = await db.query('SELECT name FROM schools WHERE id = $1', [user.school_id]);
  const schoolName = schoolRes.rows[0] && schoolRes.rows[0].name;
  require('../../core/email')
    .sendPasswordReset({ to: user.email, resetUrl, schoolName })
    .catch(() => {});

  const exposeToken = process.env.PASSWORD_RESET_EXPOSE_TOKEN === '1';
  return exposeToken ? { ok: true, token } : { ok: true };
}

/**
 * Complete a password reset: verify the token, update the password, invalidate the token.
 */
async function resetPassword({ token, newPassword }, ip) {
  requireFields({ token, newPassword }, ['token', 'newPassword']);
  if (newPassword.length < 8) throw new ValidationError('Password must be at least 8 characters');

  const res = await db.query(
    `SELECT pr.*, u.school_id FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
      WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > NOW()`,
    [hashToken(token)]
  );
  const row = res.rows[0];
  if (!row) throw new AuthError('Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  await db.withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, row.user_id]);
    await client.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [row.id]);
  });

  writeAudit({
    schoolId: row.school_id,
    userId: row.user_id,
    action: 'auth.reset_password',
    entity: 'user',
    entityId: row.user_id,
    ip
  });
  return { ok: true };
}

async function changePassword(userId, { currentPassword, newPassword }, ip) {
  requireFields({ currentPassword, newPassword }, ['currentPassword', 'newPassword']);
  if (newPassword.length < 8) throw new ValidationError('Password must be at least 8 characters');

  const res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = res.rows[0];
  if (!user) throw new NotFoundError('User not found');

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw new AuthError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

  writeAudit({
    schoolId: user.school_id,
    userId: user.id,
    action: 'auth.change_password',
    entity: 'user',
    entityId: user.id,
    ip
  });
  return { ok: true };
}

module.exports = {
  login,
  createUser,
  listUsers,
  requestPasswordReset,
  resetPassword,
  changePassword,
  ROLES
};
