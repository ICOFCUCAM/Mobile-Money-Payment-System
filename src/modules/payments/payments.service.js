'use strict';

const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
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
 *   2. Reject if the same (school, provider, external_id) already exists — stops replay.
 *   3. Call the provider's verifyTransaction().
 *   4. On success: insert the transaction and credit the student's balance in one DB transaction.
 */
async function submitTransaction(school, payload, actor, ip) {
  requireFields(payload, ['studentCode', 'provider', 'externalId']);
  const provider = String(payload.provider).toUpperCase();

  const student = await studentsService.findByCode(school.id, payload.studentCode);
  if (!student) throw new NotFoundError('Student not found');

  const dup = await db.query(
    'SELECT id, status FROM transactions WHERE school_id = $1 AND provider = $2 AND external_id = $3',
    [school.id, provider, payload.externalId]
  );
  if (dup.rows.length) {
    throw new ConflictError(`Transaction ${payload.externalId} already processed (status=${dup.rows[0].status})`);
  }

  const providerInstance = await getProviderForSchool(school.id, provider);
  const verification = await providerInstance.verifyTransaction(payload.externalId);

  const amount = verification.amount != null ? assertPositiveInt(verification.amount, 'amount') : null;
  const currency = verification.currency || student.currency || 'XAF';

  if (!verification.ok || verification.status !== 'success') {
    const id = uuid();
    await db.query(
      `INSERT INTO transactions
        (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
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
      ]
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
  await db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO transactions
        (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'success', $8, $9, NOW())`,
      [
        txId,
        school.id,
        student.id,
        provider,
        payload.externalId,
        amount,
        currency,
        verification.phone || null,
        JSON.stringify(verification.raw || {})
      ]
    );
    await studentsService.creditBalance(school.id, student.id, amount, client);
  });

  writeAudit({
    schoolId: school.id,
    userId: actor && actor.id,
    action: 'payment.verified',
    entity: 'transaction',
    entityId: txId,
    metadata: { provider, externalId: payload.externalId, amount, currency },
    ip
  });

  logger.info(
    `Transaction verified: ${provider}/${payload.externalId} school=${school.slug} amount=${amount} ${currency}`
  );

  return getTransaction(school.id, txId);
}

/**
 * Record a transaction received via webhook. Idempotent.
 * Returns { created: boolean, transaction }.
 */
async function recordWebhookTransaction(school, provider, event, rawBody) {
  if (!event.externalId) throw new ValidationError('Webhook missing external id');

  const existingRes = await db.query(
    'SELECT * FROM transactions WHERE school_id = $1 AND provider = $2 AND external_id = $3',
    [school.id, provider, event.externalId]
  );
  const existing = existingRes.rows[0];

  if (existing) {
    if (existing.status === 'success' || event.status !== 'success') {
      return { created: false, transaction: existing };
    }
    const amount = event.amount || Number(existing.amount);
    await db.withTransaction(async (client) => {
      await client.query(
        `UPDATE transactions SET status = 'success', amount = $1, verified_at = NOW(), raw_response = $2
         WHERE id = $3`,
        [amount, rawBody, existing.id]
      );
      if (existing.student_id) {
        await studentsService.creditBalance(school.id, existing.student_id, amount, client);
      }
    });
    const refreshed = await db.query('SELECT * FROM transactions WHERE id = $1', [existing.id]);
    return { created: false, transaction: refreshed.rows[0] };
  }

  // Try to find a student via phone if present — webhook-first payments may not reference a student code.
  let studentId = null;
  if (event.phone) {
    const sRes = await db.query('SELECT id FROM students WHERE school_id = $1 AND phone = $2', [school.id, event.phone]);
    if (sRes.rows[0]) studentId = sRes.rows[0].id;
  }

  const txId = uuid();
  const amount = event.amount || 0;
  await db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO transactions
        (id, school_id, student_id, provider, external_id, amount, currency, status, phone, raw_response, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
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
        event.status === 'success' ? new Date() : null
      ]
    );
    if (event.status === 'success' && studentId && amount > 0) {
      await studentsService.creditBalance(school.id, studentId, amount, client);
    }
  });

  writeAudit({
    schoolId: school.id,
    action: 'payment.webhook',
    entity: 'transaction',
    entityId: txId,
    metadata: { provider, externalId: event.externalId, status: event.status, amount }
  });

  // Receipt email hook: src/core/email.js exposes sendPaymentReceipt. Not
  // auto-called here because students don't yet carry a parent_email. Once
  // we add that column (or decide SMS is the primary receipt channel),
  // wire it here and in the existing-record upgrade path above.

  const inserted = await db.query('SELECT * FROM transactions WHERE id = $1', [txId]);
  return { created: true, transaction: inserted.rows[0] };
}

async function getTransaction(schoolId, id) {
  const res = await db.query('SELECT * FROM transactions WHERE school_id = $1 AND id = $2', [schoolId, id]);
  const row = res.rows[0];
  if (!row) throw new NotFoundError('Transaction not found');
  return row;
}

async function listTransactions(schoolId, { status, provider, studentId, limit = 100, offset = 0 } = {}) {
  const args = [schoolId];
  let where = 'school_id = $1';
  if (status) {
    args.push(status);
    where += ` AND status = $${args.length}`;
  }
  if (provider) {
    args.push(String(provider).toUpperCase());
    where += ` AND provider = $${args.length}`;
  }
  if (studentId) {
    args.push(studentId);
    where += ` AND student_id = $${args.length}`;
  }
  args.push(Math.min(Number(limit) || 100, 500));
  args.push(Math.max(Number(offset) || 0, 0));
  const res = await db.query(
    `SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT $${args.length - 1} OFFSET $${args.length}`,
    args
  );
  return res.rows;
}

async function summary(schoolId) {
  const totalsRes = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status='success')::int AS success,
       COUNT(*) FILTER (WHERE status='pending')::int AS pending,
       COUNT(*) FILTER (WHERE status='failed')::int AS failed,
       COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0)::bigint AS amount_collected
     FROM transactions WHERE school_id = $1`,
    [schoolId]
  );
  const studentsRes = await db.query('SELECT COUNT(*)::int AS c FROM students WHERE school_id = $1', [schoolId]);
  const r = totalsRes.rows[0];
  return {
    total: r.total,
    success: r.success,
    pending: r.pending,
    failed: r.failed,
    amount_collected: Number(r.amount_collected),
    students: studentsRes.rows[0].c
  };
}

/**
 * Reverse a previously-successful transaction. Debits the student's balance
 * by the original amount and marks the transaction as `reversed`. Idempotent —
 * re-reversing a reversed transaction is a no-op.
 */
async function reverseTransaction(school, transactionId, { reason } = {}, actor, ip) {
  const txRes = await db.query(
    'SELECT * FROM transactions WHERE school_id = $1 AND id = $2',
    [school.id, transactionId]
  );
  const tx = txRes.rows[0];
  if (!tx) throw new NotFoundError('Transaction not found');
  if (tx.status === 'reversed') return tx;
  if (tx.status !== 'success') {
    throw new ValidationError(`Only successful transactions can be reversed (got "${tx.status}")`);
  }

  await db.withTransaction(async (client) => {
    await client.query(
      `UPDATE transactions SET status = 'reversed', updated_at = NOW() WHERE id = $1`,
      [tx.id]
    );
    if (tx.student_id) {
      await studentsService.creditBalance(school.id, tx.student_id, -Number(tx.amount), client);
    }
  });

  writeAudit({
    schoolId: school.id,
    userId: actor && actor.id,
    action: 'payment.reversed',
    entity: 'transaction',
    entityId: tx.id,
    metadata: { amount: tx.amount, reason: reason || null },
    ip
  });

  logger.info(`Transaction reversed: ${tx.provider}/${tx.external_id} school=${school.slug} amount=${tx.amount}`);

  return getTransaction(school.id, tx.id);
}

/**
 * Reconcile pending transactions by re-polling each provider for status.
 * Intended to be called by a cron job every few minutes. Returns counts.
 */
async function reconcilePending(school, { limit = 50 } = {}) {
  const pending = await db.query(
    `SELECT * FROM transactions
       WHERE school_id = $1 AND status = 'pending'
       ORDER BY created_at ASC
       LIMIT $2`,
    [school.id, Math.min(Number(limit) || 50, 500)]
  );

  const counts = { checked: pending.rows.length, success: 0, failed: 0, stillPending: 0, errored: 0 };

  for (const tx of pending.rows) {
    try {
      const provider = await getProviderForSchool(school.id, tx.provider);
      const v = await provider.verifyTransaction(tx.external_id);
      if (v.ok && v.status === 'success') {
        const amount = v.amount != null ? Number(v.amount) : Number(tx.amount);
        await db.withTransaction(async (client) => {
          await client.query(
            `UPDATE transactions SET status = 'success', amount = $1, verified_at = NOW(),
                                     raw_response = $2, updated_at = NOW()
             WHERE id = $3`,
            [amount, JSON.stringify(v.raw || {}), tx.id]
          );
          if (tx.student_id) {
            await studentsService.creditBalance(school.id, tx.student_id, amount, client);
          }
        });
        counts.success += 1;
      } else if (v.status === 'failed') {
        await db.query(
          `UPDATE transactions SET status = 'failed', raw_response = $1, updated_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(v.raw || {}), tx.id]
        );
        counts.failed += 1;
      } else {
        counts.stillPending += 1;
      }
    } catch (err) {
      logger.warn(`Reconciliation failed for tx ${tx.id}`, err.message);
      counts.errored += 1;
    }
  }

  writeAudit({
    schoolId: school.id,
    action: 'payment.reconcile',
    metadata: counts
  });

  return counts;
}

module.exports = {
  submitTransaction,
  recordWebhookTransaction,
  getTransaction,
  listTransactions,
  summary,
  reverseTransaction,
  reconcilePending
};
