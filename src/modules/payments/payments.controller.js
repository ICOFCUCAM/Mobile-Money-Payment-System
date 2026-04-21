'use strict';

const service = require('./payments.service');

async function submit(req, res) {
  const transaction = await service.submitTransaction(req.school, req.body, req.user, req.ip);
  res.status(201).json({ transaction });
}

async function list(req, res) {
  const transactions = await service.listTransactions(req.school.id, req.query);
  res.json({ transactions });
}

async function get(req, res) {
  const transaction = await service.getTransaction(req.school.id, req.params.id);
  res.json({ transaction });
}

async function summary(req, res) {
  res.json({ summary: await service.summary(req.school.id) });
}

async function reverse(req, res) {
  const transaction = await service.reverseTransaction(req.school, req.params.id, req.body, req.user, req.ip);
  res.json({ transaction });
}

async function reconcile(req, res) {
  const result = await service.reconcilePending(req.school, req.query);
  res.json(result);
}

/**
 * CSV export of transactions. Respects the same filters as GET /payments.
 * Streams up to 10k rows per request — paginate via ?offset= for more.
 */
async function exportCsv(req, res) {
  const rows = await service.listTransactions(req.school.id, {
    ...req.query,
    limit: Math.min(Number(req.query.limit) || 10_000, 10_000)
  });

  const headers = [
    'id',
    'created_at',
    'verified_at',
    'provider',
    'external_id',
    'student_id',
    'amount',
    'currency',
    'status',
    'phone'
  ];

  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }

  const filename = `transactions-${req.school.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(lines.join('\n') + '\n');
}

module.exports = { submit, list, get, summary, reverse, reconcile, exportCsv };
