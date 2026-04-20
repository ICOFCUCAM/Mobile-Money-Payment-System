'use strict';

// Entry point for Vercel serverless functions.
// `vercel.json` routes every incoming request (including /webhooks/*) here.
// The schema is ensured lazily on the first DB call (see src/core/database.js).

require('dotenv').config();

const app = require('../src/app');

module.exports = app;
