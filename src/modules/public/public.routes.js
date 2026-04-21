'use strict';

const express = require('express');
const cors = require('cors');
const ctrl = require('./public.controller');
const { authSchoolApiKey } = require('./publicAuth');
const asyncHandler = require('../../utils/asyncHandler');
const { paymentLimiter } = require('../../middleware/rateLimiter');
const { requireProviderAllowed } = require('../../middleware/planGuard');

const router = express.Router();

// Public integration endpoints are called from school websites — permissive CORS.
router.use(cors({ origin: true, credentials: false }));
router.options('*', cors());

router.use(authSchoolApiKey);

router.post(
  '/verify-payment',
  paymentLimiter,
  requireProviderAllowed,
  asyncHandler(ctrl.verifyPayment)
);

router.get(
  '/transactions/:external_id',
  asyncHandler(ctrl.lookupTransaction)
);

module.exports = router;
