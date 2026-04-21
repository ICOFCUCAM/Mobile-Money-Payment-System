'use strict';

const { db } = require('../../core/database');
const { AuthError, NotFoundError, ValidationError } = require('../../core/errors');
const { REGISTRY, getProviderForSchool } = require('../../providers/ProviderFactory');
const paymentsService = require('../payments/payments.service');
const logger = require('../../core/logger');

/**
 * Incoming provider webhook.
 *
 * Route shape: POST /webhooks/:provider/:schoolSlug
 * Providers post here after successful mobile-money collections. We:
 *   1. Look up the school by slug.
 *   2. Instantiate the school's provider instance (with its creds).
 *   3. Validate the signature using the school's own api_secret.
 *   4. Parse + upsert the transaction idempotently.
 */
async function handle(req, res, next) {
  try {
    const providerId = String(req.params.provider || '').toUpperCase();
    const schoolSlug = req.params.schoolSlug;
    if (!REGISTRY[providerId]) throw new ValidationError(`Unknown provider: ${providerId}`);

    const schoolRes = await db.query('SELECT * FROM schools WHERE slug = $1 AND is_active = TRUE', [schoolSlug]);
    const school = schoolRes.rows[0];
    if (!school) throw new NotFoundError('Unknown school');

    const provider = await getProviderForSchool(school.id, providerId);

    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    if (!provider.verifyWebhook(req.headers, rawBody)) {
      logger.warn(`Webhook signature invalid: provider=${providerId} school=${schoolSlug}`);
      throw new AuthError('Invalid webhook signature');
    }

    const event = provider.parseWebhook(req.body);
    const result = await paymentsService.recordWebhookTransaction(school, providerId, event, rawBody);

    res.status(result.created ? 201 : 200).json({ ok: true, created: result.created });
  } catch (err) {
    next(err);
  }
}

module.exports = { handle };
