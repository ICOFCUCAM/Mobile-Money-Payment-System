'use strict';

const express = require('express');
const ctrl = require('./schools.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

const router = express.Router();

// Public: self-service school sign-up.
router.post('/register', asyncHandler(ctrl.register));

// Authenticated: school administration.
router.get('/me', authJwt, asyncHandler(ctrl.me));
router.patch('/me', authJwt, requireRole('admin'), asyncHandler(ctrl.update));
router.post('/me/api-key/rotate', authJwt, requireRole('admin'), asyncHandler(ctrl.rotateApiKey));

// Payment provider configuration
router.get('/me/payment-configs', authJwt, requireRole('admin', 'bursar'), asyncHandler(ctrl.listConfigs));
router.put('/me/payment-configs', authJwt, requireRole('admin'), asyncHandler(ctrl.upsertConfig));

module.exports = router;
