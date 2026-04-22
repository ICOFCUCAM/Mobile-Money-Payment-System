'use strict';

const express = require('express');
const ctrl = require('./auth.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.post('/password-reset/request', authLimiter, asyncHandler(ctrl.requestPasswordReset));
router.post('/password-reset/confirm', authLimiter, asyncHandler(ctrl.resetPassword));

router.get('/me', authJwt, asyncHandler(ctrl.me));
router.post('/change-password', authJwt, asyncHandler(ctrl.changePassword));
router.get('/users', authJwt, requireRole('admin'), asyncHandler(ctrl.listUsers));
router.post('/users', authJwt, requireRole('admin'), asyncHandler(ctrl.createUser));

// TOTP 2FA — all require an authenticated session (can't enroll without
// logging in first with just password). Login flow will refuse to issue
// a token for accounts where 2FA is required but not yet enrolled.
const twofa = require('./twofa.service');
router.post('/2fa/setup',    authJwt, asyncHandler(async (req, res) => {
  const r = await twofa.startSetup(req.user);
  res.json(r);
}));
router.post('/2fa/confirm',  authJwt, asyncHandler(async (req, res) => {
  const r = await twofa.confirmSetup(req.user, req.body && req.body.code);
  res.json(r);
}));
router.post('/2fa/disable',  authJwt, asyncHandler(async (req, res) => {
  const r = await twofa.disable(req.user, req.body && req.body.code);
  res.json(r);
}));

module.exports = router;
