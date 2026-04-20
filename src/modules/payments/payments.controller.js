'use strict';

const service = require('./payments.service');

async function submit(req, res) {
  const transaction = await service.submitTransaction(req.school, req.body, req.user, req.ip);
  res.status(201).json({ transaction });
}

async function list(req, res) {
  const transactions = service.listTransactions(req.school.id, req.query);
  res.json({ transactions });
}

async function get(req, res) {
  const transaction = service.getTransaction(req.school.id, req.params.id);
  res.json({ transaction });
}

async function summary(req, res) {
  res.json({ summary: service.summary(req.school.id) });
}

module.exports = { submit, list, get, summary };
