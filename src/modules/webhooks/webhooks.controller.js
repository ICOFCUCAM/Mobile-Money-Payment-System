'use strict';

const { db } = require('../../core/database');
const { AuthError, NotFoundError, ValidationError } = require('../../core/errors');
const { REGISTRY, getProviderForSchool } = require('../../providers/ProviderFactory');
const paymentsService = require('../payments/payments.service');
const billingService = require('../billing/billing.service');
const logger = require('../../core/logger');

/**
 * Incoming provider webhook.
 *
 * Route shape: POST /webhooks/:provider/:schoolSlug
 *
 * Two flows, branched on the schoolSlug:
 *   • schoolpay-billing  →  credit the payer school's wallet via the
 *     reference code in the payment memo (our corporate MoMo account).
 *   • any other slug     →  record as a student payment on that tenant
 *     (the existing path).
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

    // Billing-tenant branch: reroute incoming payments to the wallet ledger
    // using the reference in the memo, NOT the student ledger.
    if (school.is_billing_tenant) {
      const reference =
        event.reference || event.memo || event.narration ||
        (req.body && (req.body.reference || req.body.memo || req.body.narration));
      const result = await billingService.creditFromInboundPayment({
        rail: `${providerId.toLowerCase()}_momo`,
        externalId: event.externalId,
        reference,
        amountCents: Math.floor(Number(event.amount) || 0),
        currency: event.currency || 'USD',
        rawMemo: reference
      });
      return res.status(result.credited ? 201 : 200).json({ ok: true, ...result });
    }

    // School-tenant branch: original student-payment flow.
    const result = await paymentsService.recordWebhookTransaction(school, providerId, event, rawBody);
    res.status(result.created ? 201 : 200).json({ ok: true, created: result.created });
  } catch (err) {
    next(err);
  }
}

module.exports = { handle };
