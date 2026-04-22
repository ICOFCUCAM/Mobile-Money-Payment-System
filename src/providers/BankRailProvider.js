'use strict';

const BaseProvider = require('./BaseProvider');

/**
 * BankRailProvider — scaffolding for bank transfer rails (Flutterwave,
 * Paystack, direct SWIFT via an aggregator, etc.).
 *
 * Not live yet. Registered so the frontend can list "Bank transfer (coming
 * soon)" without surprises, and so ops can configure credentials ahead
 * of the launch. All the webhook → wallet crediting plumbing already
 * works — a concrete implementation only needs to parse the provider's
 * webhook payload into the shared `{ externalId, amount, currency,
 * reference }` shape the billing service expects.
 *
 * Signature verification defaults to a simple HMAC of the raw body; most
 * bank aggregators (Flutterwave, Paystack) follow that pattern.
 */
class BankRailProvider extends BaseProvider {
  static get id() { return 'BANK'; }

  constructor(opts) {
    super(opts);
    this.providerId = BankRailProvider.id;
  }

  /** Bank payments are webhook-first; no outbound verify call yet. */
  async verifyTransaction(externalId) {
    return {
      ok: false,
      status: 'pending',
      amount: null,
      currency: null,
      phone: null,
      raw: { note: 'Bank rail is scaffolded — implementation pending aggregator choice.', externalId }
    };
  }

  /**
   * Generic webhook parser. Expects aggregator to POST:
   *   { event: 'transfer.success', data: { id, amount, currency, reference, memo } }
   * Subclasses (FlutterwaveRail, PaystackRail) override as needed.
   */
  parseWebhook(body) {
    const data = (body && body.data) || body || {};
    return {
      externalId: String(data.id || data.transaction_id || data.reference || ''),
      status: data.status === 'successful' || data.status === 'success' ? 'success' : (data.status || 'pending'),
      amount: Number(data.amount) || 0,
      currency: data.currency || 'USD',
      reference: data.reference || data.memo || data.narration || '',
      phone: data.phone || null,
      raw: data
    };
  }

  /** HMAC-SHA256 of raw body, compared to `X-Webhook-Signature` header. */
  verifyWebhook(headers, rawBody) {
    const crypto = require('crypto');
    const secret = this.credentials && this.credentials.api_secret;
    if (!secret) return false;
    const sig =
      headers['x-webhook-signature'] ||
      headers['verif-hash'] ||           // Flutterwave
      headers['x-paystack-signature'] || // Paystack
      '';
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return sig.length > 0 && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }
}

module.exports = BankRailProvider;
