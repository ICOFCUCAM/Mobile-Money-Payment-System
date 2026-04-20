'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb, writeAudit } = require('../../core/database');
const { signToken } = require('../../middleware/auth');
const { AuthError, ConflictError, ValidationError } = require('../../core/errors');
const { assertEmail, assertEnum, requireFields } = require('../../utils/validators');
const config = require('../../config');

const ROLES = ['admin', 'bursar', 'auditor'];

async function login({ email, password, schoolSlug }, ip) {
  requireFields({ email, password }, ['email', 'password']);
  const db = getDb();
  const school = schoolSlug
    ? db.prepare('SELECT * FROM schools WHERE slug = ? AND is_active = 1').get(schoolSlug)
    : db
        .prepare(
          `SELECT s.* FROM schools s
           JOIN users u ON u.school_id = s.id
           WHERE u.email = ? AND s.is_active = 1
           LIMIT 1`
        )
        .get(String(email).toLowerCase());

  if (!school) throw new AuthError('Invalid credentials');

  const user = db
    .prepare('SELECT * FROM users WHERE school_id = ? AND email = ? AND is_active = 1')
    .get(school.id, String(email).toLowerCase());
  if (!user) throw new AuthError('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AuthError('Invalid credentials');

  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);
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

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM users WHERE school_id = ? AND email = ?')
    .get(schoolId, payload.email.toLowerCase());
  if (existing) throw new ConflictError('User with that email already exists');

  const passwordHash = await bcrypt.hash(payload.password, config.security.bcryptRounds);
  const id = uuid();
  db.prepare(
    `INSERT INTO users (id, school_id, email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, schoolId, payload.email.toLowerCase(), passwordHash, payload.fullName, payload.role);

  writeAudit({
    schoolId,
    userId: actor && actor.id,
    action: 'user.create',
    entity: 'user',
    entityId: id,
    metadata: { role: payload.role },
    ip
  });

  return { id, email: payload.email.toLowerCase(), role: payload.role, fullName: payload.fullName };
}

function listUsers(schoolId) {
  return getDb()
    .prepare('SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM users WHERE school_id = ?')
    .all(schoolId);
}

module.exports = { login, createUser, listUsers, ROLES };
