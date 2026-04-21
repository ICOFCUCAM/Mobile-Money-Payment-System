'use strict';

const express = require('express');
const ctrl = require('./payments.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authAny } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { requireProviderAllowed } = require('../../middleware/planGuard');
const { paymentLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(authAny);

router.get('/', asyncHandler(ctrl.list));
router.get('/summary', asyncHandler(ctrl.summary));
router.get('/export.csv', asyncHandler(ctrl.exportCsv));
router.post(
  '/reconcile',
  (req, _res, next) => (req.user ? requireRole('admin', 'bursar')(req, _res, next) : next()),
  asyncHandler(ctrl.reconcile)
);
router.get('/:id', asyncHandler(ctrl.get));
router.post(
  '/:id/reverse',
  (req, _res, next) => (req.user ? requireRole('admin')(req, _res, next) : next()),
  asyncHandler(ctrl.reverse)
);

// Machine clients (X-API-Key) have no req.user, so requireRole is skipped — but planGuard still applies.
router.post(
  '/',
  paymentLimiter,
  (req, _res, next) => (req.user ? requireRole('admin', 'bursar')(req, _res, next) : next()),
  requireProviderAllowed,
  asyncHandler(ctrl.submit)
);

module.exports = router;
