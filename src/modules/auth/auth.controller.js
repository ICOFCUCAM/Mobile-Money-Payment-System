'use strict';

const service = require('./auth.service');

async function login(req, res) {
  const result = await service.login(req.body, req.ip);
  res.json(result);
}

async function me(req, res) {
  // Policy check: platform admins in the schoolpay-billing tenant must 2FA.
  // Surface that flag so the dashboard can show a "Enable 2FA now" banner.
  const twofa = require('./twofa.service');
  const must_enroll_2fa = twofa.isRequiredFor(req.user) && !req.user.totp_secret;

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      twofa_enabled:  !!req.user.totp_secret,
      must_enroll_2fa
    },
    school: {
      id: req.school.id, slug: req.school.slug,
      name: req.school.name, plan: req.school.subscription_plan
    }
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
