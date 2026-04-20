'use strict';

const express = require('express');
const ctrl = require('./students.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { authAny } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

const router = express.Router();

router.use(authAny);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', requireRole('admin', 'bursar'), asyncHandler(ctrl.create));
router.patch('/:id', requireRole('admin', 'bursar'), asyncHandler(ctrl.update));
router.delete('/:id', requireRole('admin'), asyncHandler(ctrl.remove));

module.exports = router;
