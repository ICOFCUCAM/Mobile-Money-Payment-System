'use strict';

const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
const { ConflictError, NotFoundError, PlanRestrictionError } = require('../../core/errors');
const { requireFields } = require('../../utils/validators');
const { getPlan } = require('../subscriptions/plans');

async function countStudents(schoolId) {
  const res = await db.query('SELECT COUNT(*)::int AS c FROM students WHERE school_id = $1', [schoolId]);
  return res.rows[0].c;
}

async function enforceStudentQuota(school) {
  const plan = getPlan(school.subscription_plan) || getPlan('basic');
  const limit = plan.features.maxStudents;
  if (limit === Infinity) return;
  const current = await countStudents(school.id);
  if (current >= limit) {
    throw new PlanRestrictionError(`Plan "${plan.id}" caps students at ${limit}. Upgrade to add more.`);
  }
}

async function createStudent(school, payload, actor, ip) {
  requireFields(payload, ['studentCode', 'fullName']);
  await enforceStudentQuota(school);

  const existing = await db.query(
    'SELECT id FROM students WHERE school_id = $1 AND student_code = $2',
    [school.id, payload.studentCode]
  );
  if (existing.rows.length) throw new ConflictError('Student code already exists in this school');

  const id = uuid();
  await db.query(
    `INSERT INTO students (id, school_id, student_code, full_name, class_name, phone)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, school.id, payload.studentCode, payload.fullName, payload.className || null, payload.phone || null]
  );

  writeAudit({ schoolId: school.id, userId: actor && actor.id, action: 'student.create', entity: 'student', entityId: id, ip });
  return getStudent(school.id, id);
}

async function getStudent(schoolId, id) {
  const res = await db.query('SELECT * FROM students WHERE school_id = $1 AND id = $2', [schoolId, id]);
  const row = res.rows[0];
  if (!row) throw new NotFoundError('Student not found');
  return row;
}

async function findByCode(schoolId, studentCode) {
  const res = await db.query(
    'SELECT * FROM students WHERE school_id = $1 AND student_code = $2',
    [schoolId, studentCode]
  );
  return res.rows[0] || null;
}

async function listStudents(schoolId, { q, limit = 100, offset = 0 } = {}) {
  const args = [schoolId];
  let where = 'school_id = $1';
  if (q) {
    where += ` AND (full_name ILIKE $${args.length + 1} OR student_code ILIKE $${args.length + 2})`;
    args.push(`%${q}%`, `%${q}%`);
  }
  args.push(Math.min(Number(limit) || 100, 500), Math.max(Number(offset) || 0, 0));
  const res = await db.query(
    `SELECT * FROM students WHERE ${where} ORDER BY created_at DESC LIMIT $${args.length - 1} OFFSET $${args.length}`,
    args
  );
  return res.rows;
}

async function updateStudent(schoolId, id, patch, actor) {
  const allowed = ['full_name', 'class_name', 'phone'];
  const fields = [];
  const values = [];
  let i = 1;
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = $${i++}`);
      values.push(patch[k]);
    }
  }
  if (!fields.length) return getStudent(schoolId, id);
  values.push(schoolId, id);
  await db.query(
    `UPDATE students SET ${fields.join(', ')} WHERE school_id = $${i++} AND id = $${i}`,
    values
  );
  writeAudit({ schoolId, userId: actor && actor.id, action: 'student.update', entity: 'student', entityId: id });
  return getStudent(schoolId, id);
}

async function deleteStudent(schoolId, id, actor) {
  const res = await db.query('DELETE FROM students WHERE school_id = $1 AND id = $2', [schoolId, id]);
  if (!res.rowCount) throw new NotFoundError('Student not found');
  writeAudit({ schoolId, userId: actor && actor.id, action: 'student.delete', entity: 'student', entityId: id });
}

/** Credit a student's balance. Accepts an optional pg client for use inside a transaction. */
async function creditBalance(schoolId, studentId, amount, client) {
  const runner = client || db;
  await runner.query(
    'UPDATE students SET balance = balance + $1 WHERE school_id = $2 AND id = $3',
    [amount, schoolId, studentId]
  );
}

module.exports = {
  createStudent,
  getStudent,
  findByCode,
  listStudents,
  updateStudent,
  deleteStudent,
  creditBalance,
  countStudents
};
