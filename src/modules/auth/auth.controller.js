'use strict';

const service = require('./auth.service');

async function login(req, res) {
  const result = await service.login(req.body, req.ip);
  res.json(result);
}

async function me(req, res) {
  res.json({
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
    school: { id: req.school.id, slug: req.school.slug, name: req.school.name, plan: req.school.subscription_plan }
  });
}

async function createUser(req, res) {
  const user = await service.createUser(req.school.id, req.body, req.user, req.ip);
  res.status(201).json({ user });
}

async function listUsers(req, res) {
  res.json({ users: service.listUsers(req.school.id) });
}

module.exports = { login, me, createUser, listUsers };
