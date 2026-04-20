'use strict';

const express = require('express');
const ctrl = require('./dashboard.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireFeature } = require('../../middleware/planGuard');

const router = express.Router();

router.use(authJwt);
router.get('/overview', asyncHandler(ctrl.overview));
router.get('/report', requireFeature('reports'), asyncHandler(ctrl.report));

module.exports = router;
