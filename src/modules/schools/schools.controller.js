'use strict';

const service = require('./schools.service');

async function register(req, res) {
  const result = await service.registerSchool(req.body, req.ip);
  res.status(201).json(result);
}

async function me(req, res) {
  res.json({ school: service.getSchool(req.school.id) });
}

async function update(req, res) {
  const school = service.updateSchool(req.school.id, req.body, req.user);
  res.json({ school });
}

async function rotateApiKey(req, res) {
  const apiKey = service.rotateApiKey(req.school.id, req.user);
  res.json({ apiKey });
}

async function upsertConfig(req, res) {
  const configs = service.upsertPaymentConfig(req.school.id, req.body, req.user);
  res.status(201).json({ configs });
}

async function listConfigs(req, res) {
  res.json({ configs: service.listPaymentConfigs(req.school.id) });
}

module.exports = { register, me, update, rotateApiKey, upsertConfig, listConfigs };
