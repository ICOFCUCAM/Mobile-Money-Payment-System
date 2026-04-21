'use strict';

const paymentsService = require('../payments/payments.service');
const studentsService = require('../students/students.service');
const { ValidationError, NotFoundError } = require('../../core/errors');

/**
 * Public verify-payment endpoint for third-party school websites.
 *
 *   POST /api/public/verify-payment
 *   Authorization: Bearer SCHOOL_API_KEY
 *   Body: { school_id, student_id, transaction_id, provider, amount?, currency? }
 *
 * Returns a compact, school-website-friendly payload. The heavy lifting is
 * delegated to paymentsService.submitTransaction, which already handles
 * duplicate detection, provider verification, crediting, and audit logging.
 */
async function verifyPayment(req, res) {
  const body = req.body || {};

  // Accept both snake_case (spec) and camelCase (internal).
  const schoolId      = body.school_id      || body.schoolId;
  const studentCode   = body.student_id     || body.studentId    || body.studentCode;
  const externalId    = body.transaction_id || body.transactionId || body.externalId;
  const provider      = body.provider;

  if (!studentCode) throw new ValidationError('student_id is required');
  if (!externalId)  throw new ValidationError('transaction_id is required');
  if (!provider)    throw new ValidationError('provider is required');

  // The Bearer key already scoped req.school — if the body's school_id doesn't
  // match, reject loudly so a leaked key can't be used against a different school
  // by pasting in another school's id.
  if (schoolId && schoolId !== req.school.id && schoolId !== req.school.slug) {
    throw new ValidationError('school_id does not match the API key tenant');
  }

  try {
    const transaction = await paymentsService.submitTransaction(
      req.school,
      { studentCode, externalId, provider },
      null,
      req.ip
    );

    // Look up the updated student balance so the school site can display it.
    const student = await studentsService.findByCode(req.school.id, studentCode);

    return res.json({
      ok: true,
      status: transaction.status,
      transaction: {
        id: transaction.id,
        provider: transaction.provider,
        external_id: transaction.external_id,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        verified_at: transaction.verified_at
      },
      student: student
        ? {
            id: student.id,
            code: student.student_code,
            name: student.full_name,
            balance: Number(student.balance),
            currency: student.currency
          }
        : null
    });
  } catch (err) {
    // Translate internal errors into a public-friendly shape.
    if (err instanceof NotFoundError) {
      return res.status(404).json({ ok: false, error: { code: 'STUDENT_NOT_FOUND', message: err.message } });
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({ ok: false, error: { code: 'DUPLICATE', message: err.message } });
    }
    throw err;
  }
}

/**
 * Read-only status lookup — useful for school websites that want to poll
 * a recently-submitted transaction.
 *
 *   GET /api/public/transactions/:external_id?provider=MTN
 *   Authorization: Bearer SCHOOL_API_KEY
 */
async function lookupTransaction(req, res) {
  const provider = String(req.query.provider || '').toUpperCase();
  const externalId = req.params.external_id;
  if (!provider) throw new ValidationError('provider query parameter is required');

  const { db } = require('../../core/database');
  const r = await db.query(
    'SELECT * FROM transactions WHERE school_id = $1 AND provider = $2 AND external_id = $3',
    [req.school.id, provider, externalId]
  );
  const tx = r.rows[0];
  if (!tx) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
  return res.json({
    ok: true,
    transaction: {
      id: tx.id,
      provider: tx.provider,
      external_id: tx.external_id,
      amount: Number(tx.amount),
      currency: tx.currency,
      status: tx.status,
      verified_at: tx.verified_at
    }
  });
}

module.exports = { verifyPayment, lookupTransaction };
