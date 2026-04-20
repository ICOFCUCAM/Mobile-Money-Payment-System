'use strict';

const { db } = require('../../core/database');
const paymentsService = require('../payments/payments.service');
const studentsService = require('../students/students.service');

/**
 * Aggregated landing-page figures for the school dashboard.
 */
async function overview(req, res) {
  const schoolId = req.school.id;

  const [summary, recent, topRes, providerRes, studentCount] = await Promise.all([
    paymentsService.summary(schoolId),
    paymentsService.listTransactions(schoolId, { limit: 10 }),
    db.query(
      'SELECT id, student_code, full_name, balance FROM students WHERE school_id = $1 ORDER BY balance DESC LIMIT 5',
      [schoolId]
    ),
    db.query(
      `SELECT provider,
              COUNT(*)::int AS count,
              COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0)::bigint AS collected
       FROM transactions WHERE school_id = $1 GROUP BY provider`,
      [schoolId]
    ),
    studentsService.countStudents(schoolId)
  ]);

  res.json({
    school: {
      id: req.school.id,
      name: req.school.name,
      slug: req.school.slug,
      plan: req.school.subscription_plan
    },
    summary,
    providerBreakdown: providerRes.rows.map((r) => ({ ...r, collected: Number(r.collected) })),
    recentTransactions: recent,
    topStudents: topRes.rows.map((r) => ({ ...r, balance: Number(r.balance) })),
    studentCount
  });
}

/**
 * Time-series report of transactions grouped by day. Pro+ plans only (gated by route middleware).
 */
async function report(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days || '30', 10), 1), 365);
  const res2 = await db.query(
    `SELECT DATE(created_at) AS day,
            COUNT(*)::int AS count,
            COALESCE(SUM(CASE WHEN status='success' THEN amount ELSE 0 END), 0)::bigint AS collected
     FROM transactions
     WHERE school_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval
     GROUP BY day ORDER BY day ASC`,
    [req.school.id, String(days)]
  );
  res.json({ days, series: res2.rows.map((r) => ({ ...r, collected: Number(r.collected) })) });
}

module.exports = { overview, report };
