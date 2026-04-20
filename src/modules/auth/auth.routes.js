'use strict';

const express = require('express');
const ctrl = require('./auth.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.get('/me', authJwt, asyncHandler(ctrl.me));
router.get('/users', authJwt, requireRole('admin'), asyncHandler(ctrl.listUsers));
router.post('/users', authJwt, requireRole('admin'), asyncHandler(ctrl.createUser));

module.exports = router;
