'use strict';

const express = require('express');
const ctrl = require('./webhooks.controller');

const router = express.Router();

// IMPORTANT: the JSON body parser is mounted in app.js with a verify() hook
// that captures the raw bytes into req.rawBody so webhook signatures can be
// validated against the exact payload the provider sent.
router.post('/:provider/:schoolSlug', ctrl.handle);

module.exports = router;
