'use strict';

const express = require('express');
const ctrl = require('./subscriptions.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

const router = express.Router();

router.get('/plans', asyncHandler(ctrl.plans));
router.get('/current', authJwt, asyncHandler(ctrl.current));
router.post('/change', authJwt, requireRole('admin'), asyncHandler(ctrl.change));

module.exports = router;
