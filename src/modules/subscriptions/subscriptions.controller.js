'use strict';

const service = require('./subscriptions.service');

async function plans(_req, res) {
  res.json({ plans: service.listPlans() });
}

async function current(req, res) {
  res.json(service.currentSubscription(req.school.id));
}

async function change(req, res) {
  const result = service.changePlan(req.school.id, req.body, req.user, req.ip);
  res.json(result);
}

module.exports = { plans, current, change };
