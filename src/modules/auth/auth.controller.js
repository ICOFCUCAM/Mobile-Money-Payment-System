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
  res.json({ users: await service.listUsers(req.school.id) });
}

async function requestPasswordReset(req, res) {
  const out = await service.requestPasswordReset(req.body, req.ip);
  res.json(out);
}

async function resetPassword(req, res) {
  const out = await service.resetPassword(req.body, req.ip);
  res.json(out);
}

async function changePassword(req, res) {
  const out = await service.changePassword(req.user.id, req.body, req.ip);
  res.json(out);
}

module.exports = {
  login,
  me,
  createUser,
  listUsers,
  requestPasswordReset,
  resetPassword,
  changePassword
};
