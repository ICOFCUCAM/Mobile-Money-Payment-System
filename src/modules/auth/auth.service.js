'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
const { signToken } = require('../../middleware/auth');
const { AuthError, ConflictError, ValidationError } = require('../../core/errors');
const { assertEmail, assertEnum, requireFields } = require('../../utils/validators');
const config = require('../../config');

const ROLES = ['admin', 'bursar', 'auditor'];

async function login({ email, password, schoolSlug }, ip) {
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

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  writeAudit({ schoolId: school.id, userId: user.id, action: 'auth.login', ip });

  const token = signToken({ sub: user.id, school_id: school.id, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
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

module.exports = { login, createUser, listUsers, ROLES };
