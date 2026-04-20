'use strict';

const { v4: uuid } = require('uuid');
const { getDb, writeAudit } = require('../../core/database');
const { ConflictError, NotFoundError, PlanRestrictionError } = require('../../core/errors');
const { requireFields } = require('../../utils/validators');
const { getPlan } = require('../subscriptions/plans');

function countStudents(schoolId) {
  return getDb().prepare('SELECT COUNT(*) AS c FROM students WHERE school_id = ?').get(schoolId).c;
}

function enforceStudentQuota(school) {
  const plan = getPlan(school.subscription_plan) || getPlan('basic');
  const limit = plan.features.maxStudents;
  if (limit === Infinity) return;
  const current = countStudents(school.id);
  if (current >= limit) {
    throw new PlanRestrictionError(`Plan "${plan.id}" caps students at ${limit}. Upgrade to add more.`);
  }
}

function createStudent(school, payload, actor, ip) {
  requireFields(payload, ['studentCode', 'fullName']);
  enforceStudentQuota(school);

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM students WHERE school_id = ? AND student_code = ?')
    .get(school.id, payload.studentCode);
  if (existing) throw new ConflictError('Student code already exists in this school');

  const id = uuid();
  db.prepare(
    `INSERT INTO students (id, school_id, student_code, full_name, class_name, phone)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, school.id, payload.studentCode, payload.fullName, payload.className || null, payload.phone || null);

  writeAudit({ schoolId: school.id, userId: actor && actor.id, action: 'student.create', entity: 'student', entityId: id, ip });
  return getStudent(school.id, id);
}

function getStudent(schoolId, id) {
  const row = getDb().prepare('SELECT * FROM students WHERE school_id = ? AND id = ?').get(schoolId, id);
  if (!row) throw new NotFoundError('Student not found');
  return row;
}

function findByCode(schoolId, studentCode) {
  return getDb()
    .prepare('SELECT * FROM students WHERE school_id = ? AND student_code = ?')
    .get(schoolId, studentCode);
}

function listStudents(schoolId, { q, limit = 100, offset = 0 } = {}) {
  const args = [schoolId];
  let where = 'school_id = ?';
  if (q) {
    where += ' AND (full_name LIKE ? OR student_code LIKE ?)';
    args.push(`%${q}%`, `%${q}%`);
  }
  args.push(Number(limit), Number(offset));
  return getDb()
    .prepare(`SELECT * FROM students WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args);
}

function updateStudent(schoolId, id, patch, actor) {
  const allowed = ['full_name', 'class_name', 'phone'];
  const fields = [];
  const values = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (!fields.length) return getStudent(schoolId, id);
  values.push(schoolId, id);
  getDb()
    .prepare(`UPDATE students SET ${fields.join(', ')} WHERE school_id = ? AND id = ?`)
    .run(...values);
  writeAudit({ schoolId, userId: actor && actor.id, action: 'student.update', entity: 'student', entityId: id });
  return getStudent(schoolId, id);
}

function deleteStudent(schoolId, id, actor) {
  const res = getDb().prepare('DELETE FROM students WHERE school_id = ? AND id = ?').run(schoolId, id);
  if (!res.changes) throw new NotFoundError('Student not found');
  writeAudit({ schoolId, userId: actor && actor.id, action: 'student.delete', entity: 'student', entityId: id });
}

function creditBalance(schoolId, studentId, amount) {
  getDb()
    .prepare('UPDATE students SET balance = balance + ? WHERE school_id = ? AND id = ?')
    .run(amount, schoolId, studentId);
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
