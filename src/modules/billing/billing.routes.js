'use strict';

const express = require('express');
const ctrl = require('./billing.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authJwt } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

const router = express.Router();

// GET /api/billing/catalog — public (no auth), used by the checkout page.
router.get('/catalog', asyncHandler(ctrl.catalog));

// The rest of the billing API is JWT-authed tenant-scoped.
router.use(authJwt);

router.post('/intents',       asyncHandler(ctrl.createIntent));
router.get('/wallet',         asyncHandler(ctrl.getWallet));

// Admin platform routes — caller must be admin AND belong to the
// schoolpay-billing tenant (only our own staff).
function requirePlatformAdmin(req, res, next) {
  if (req.school.id !== 'schoolpay-billing') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Platform-admin only' } });
  }
  next();
}

router.get ('/admin/schools',  requireRole('admin'), requirePlatformAdmin, asyncHandler(ctrl.adminListSchools));
router.post('/admin/override', requireRole('admin'), requirePlatformAdmin, asyncHandler(ctrl.setOverride));

module.exports = router;
