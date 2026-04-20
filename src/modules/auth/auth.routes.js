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

module.exports = router;
