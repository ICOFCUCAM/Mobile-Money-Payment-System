'use strict';

const { getDb } = require('../../core/database');
const paymentsService = require('../payments/payments.service');
const studentsService = require('../students/students.service');

/**
 * Aggregated landing-page figures for the school dashboard.
 */
async function overview(req, res) {
  const db = getDb();
  const schoolId = req.school.id;

  const summary = paymentsService.summary(schoolId);
  const recentTransactions = paymentsService.listTransactions(schoolId, { limit: 10 });
  const topStudents = db
    .prepare('SELECT id, student_code, full_name, balance FROM students WHERE school_id = ? ORDER BY balance DESC LIMIT 5')
    .all(schoolId);
  const providerBreakdown = db
    .prepare(
      `SELECT provider, COUNT(*) AS count, COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0) AS collected
       FROM transactions WHERE school_id = ? GROUP BY provider`
    )
    .all(schoolId);

  res.json({
    school: {
      id: req.school.id,
      name: req.school.name,
      slug: req.school.slug,
      plan: req.school.subscription_plan
    },
    summary,
    providerBreakdown,
    recentTransactions,
    topStudents,
    studentCount: studentsService.countStudents(schoolId)
  });
}

/**
 * Time-series report of transactions grouped by day. Pro+ plans only (gated by route middleware).
 */
async function report(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days || '30', 10), 1), 365);
  const rows = getDb()
    .prepare(
      `SELECT date(created_at) AS day,
              COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0) AS collected
       FROM transactions
       WHERE school_id = ? AND created_at >= date('now', ?)
       GROUP BY day ORDER BY day ASC`
    )
    .all(req.school.id, `-${days} days`);
  res.json({ days, series: rows });
}

module.exports = { overview, report };
