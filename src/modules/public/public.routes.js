'use strict';

const express = require('express');
const ctrl = require('./public.controller');
const { authSchoolApiKey } = require('./publicAuth');
const asyncHandler = require('../../utils/asyncHandler');
const { paymentLimiter } = require('../../middleware/rateLimiter');
const { requireProviderAllowed } = require('../../middleware/planGuard');
const { idempotent } = require('../../middleware/idempotency');

const router = express.Router();

// CORS is applied in src/app.js (permissive profile for /api/public).
router.use(authSchoolApiKey);

// Third-party school websites can (and should) send an Idempotency-Key
// header — a retry after a network blip won't double-credit the student.
// Replay protection also exists at the (school, provider, tx_id) level
// inside paymentsService, but this header catches earlier-stage retries
// (before we even call the provider).
router.post(
  '/verify-payment',
  paymentLimiter,
  idempotent({ scope: (req) => `school:${req.school.id}:verify` }),
  requireProviderAllowed,
  asyncHandler(ctrl.verifyPayment)
);

router.get(
  '/transactions/:external_id',
  asyncHandler(ctrl.lookupTransaction)
);

module.exports = router;
