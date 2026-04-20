'use strict';

const { v4: uuid } = require('uuid');
const { getDb, writeAudit } = require('../../core/database');
const { ConflictError, NotFoundError, ValidationError } = require('../../core/errors');
const { requireFields, assertPositiveInt } = require('../../utils/validators');
const { getProviderForSchool } = require('../../providers/ProviderFactory');
const studentsService = require('../students/students.service');
const logger = require('../../core/logger');

/**
 * Submit a transaction for verification & crediting.
 *
 * Flow:
 *   1. Validate input (school tenant scope already enforced by middleware).
 *   2. Reject if the same (school, provider, external_id) already exists — stops replay/reuse.
 *   3. Call the provider's verifyTransaction().
 *   4. On success: record the transaction and credit the student's balance in one DB transaction.
 */
async function submitTransaction(school, payload, actor, ip) {
  requireFields(payload, ['studentCode', 'provider', 'externalId']);
  const provider = String(payload.provider).toUpperCase();
  const db = getDb();

  const student = studentsService.findByCode(school.id, payload.studentCode);
  if (!student) throw new NotFoundError('Student not found');

  const duplicate = db
    .prepare('SELECT id, status FROM transactions WHERE school_id = ? AND provider = ? AND external_id = ?')
    .get(school.id, provider, payload.externalId);
  if (duplicate) throw new ConflictError(`Transaction ${payload.externalId} already processed (status=${duplicate.status})`);

  const providerInstance = getProviderForSchool(school.id, provider);
  const verification = await providerInstance.verifyTransaction(payload.externalId);

  const amount = verification.amount != null ? assertPositiveInt(verification.amount, 'amount') : null;
  const currency = verification.currency || student.currency || 'XAF';

  if (!verification.ok || verification.status !== 'success') {
    const id = uuid();
    db.prepare(
      `INSERT INTO transactions (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      school.id,
      student.id,
      provider,
      payload.externalId,
      amount || 0,
      currency,
      verification.status === 'pending' ? 'pending' : 'failed',
      verification.phone || null,
      JSON.stringify(verification.raw || {})
    );
    writeAudit({
      schoolId: school.id,
      userId: actor && actor.id,
      action: 'payment.verify_failed',
      entity: 'transaction',
      entityId: id,
      metadata: { provider, externalId: payload.externalId, status: verification.status },
      ip
    });
    throw new ValidationError(`Payment verification returned status "${verification.status}"`);
  }

  if (!amount) throw new ValidationError('Provider did not return a valid amount');

  const txId = uuid();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO transactions
        (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, datetime('now'))`
    ).run(
      txId,
      school.id,
      student.id,
      provider,
      payload.externalId,
      amount,
      currency,
      verification.phone || null,
      JSON.stringify(verification.raw || {})
    );
    studentsService.creditBalance(school.id, student.id, amount);
  });
  tx();

  writeAudit({
    schoolId: school.id,
    userId: actor && actor.id,
    action: 'payment.verified',
    entity: 'transaction',
    entityId: txId,
    metadata: { provider, externalId: payload.externalId, amount, currency },
    ip
  });

  logger.info(`Transaction verified: ${provider}/${payload.externalId} school=${school.slug} amount=${amount} ${currency}`);

  return getTransaction(school.id, txId);
}

/**
 * Record a transaction received via webhook. Idempotent.
 * Returns { created: boolean, transaction }.
 */
function recordWebhookTransaction(school, provider, event, rawBody) {
  if (!event.externalId) throw new ValidationError('Webhook missing external id');
  const db = getDb();

  const existing = db
    .prepare('SELECT * FROM transactions WHERE school_id = ? AND provider = ? AND external_id = ?')
    .get(school.id, provider, event.externalId);
  if (existing) {
    // If we already marked it success, no-op. Otherwise, promote to success if the webhook says so.
    if (existing.status === 'success' || event.status !== 'success') {
      return { created: false, transaction: existing };
    }
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(existing.student_id);
    const amount = event.amount || existing.amount;
    const upgradeTx = db.transaction(() => {
      db.prepare(
        `UPDATE transactions SET status = 'success', amount = ?, verified_at = datetime('now'), raw_response = ?
         WHERE id = ?`
      ).run(amount, rawBody, existing.id);
      if (student) studentsService.creditBalance(school.id, student.id, amount);
    });
    upgradeTx();
    return { created: false, transaction: db.prepare('SELECT * FROM transactions WHERE id = ?').get(existing.id) };
  }

  // Try to find a student via phone if present — webhook-first payments may not reference a student code.
  let studentId = null;
  if (event.phone) {
    const s = db.prepare('SELECT id FROM students WHERE school_id = ? AND phone = ?').get(school.id, event.phone);
    if (s) studentId = s.id;
  }

  const txId = uuid();
  const amount = event.amount || 0;
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO transactions (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      txId,
      school.id,
      studentId,
      provider,
      event.externalId,
      amount,
      event.currency || 'XAF',
      event.status,
      event.phone || null,
      rawBody,
      event.status === 'success' ? new Date().toISOString() : null
    );
    if (event.status === 'success' && studentId && amount > 0) {
      studentsService.creditBalance(school.id, studentId, amount);
    }
  });
  tx();

  writeAudit({
    schoolId: school.id,
    action: 'payment.webhook',
    entity: 'transaction',
    entityId: txId,
    metadata: { provider, externalId: event.externalId, status: event.status, amount }
  });

  return { created: true, transaction: db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) };
}

function getTransaction(schoolId, id) {
  const row = getDb()
    .prepare('SELECT * FROM transactions WHERE school_id = ? AND id = ?')
    .get(schoolId, id);
  if (!row) throw new NotFoundError('Transaction not found');
  return row;
}

function listTransactions(schoolId, { status, provider, studentId, limit = 100, offset = 0 } = {}) {
  const args = [schoolId];
  let where = 'school_id = ?';
  if (status) {
    where += ' AND status = ?';
    args.push(status);
  }
  if (provider) {
    where += ' AND provider = ?';
    args.push(String(provider).toUpperCase());
  }
  if (studentId) {
    where += ' AND student_id = ?';
    args.push(studentId);
  }
  args.push(Number(limit), Number(offset));
  return getDb()
    .prepare(`SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args);
}

function summary(schoolId) {
  const db = getDb();
  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status='failed'  THEN 1 ELSE 0 END) AS failed,
         COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0) AS amount_collected
       FROM transactions WHERE school_id = ?`
    )
    .get(schoolId);
  const students = db.prepare('SELECT COUNT(*) AS c FROM students WHERE school_id = ?').get(schoolId).c;
  return { ...totals, students };
}

module.exports = {
  submitTransaction,
  recordWebhookTransaction,
  getTransaction,
  listTransactions,
  summary
};
