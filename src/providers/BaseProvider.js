'use strict';

/**
 * Abstract base class every payment provider must extend.
 *
 * Providers receive their per-school decrypted credentials in the constructor
 * so they never reach into the database themselves. Add a new provider by
 * subclassing this file and registering it in ProviderFactory.
 */
// Default per-request timeout for outbound provider calls. Provider APIs
// sometimes stall; without a timeout the lambda hangs until Vercel kills it
// (15s) and the user sees no error. 8s default leaves room for Postgres and
// response serialization within the 15s budget.
const PROVIDER_HTTP_TIMEOUT_MS = parseInt(process.env.PROVIDER_HTTP_TIMEOUT_MS || '8000', 10);

class BaseProvider {
  static get id() {
    throw new Error('Provider must implement static "id"');
  }

  constructor({ credentials, baseUrl, metadata } = {}) {
    this.credentials = credentials || {};
    this.baseUrl = baseUrl;
    this.metadata = metadata || {};
  }

  /**
   * fetch() wrapper with an AbortController timeout. Subclasses should use
   * this.fetch(url, options) instead of the global fetch so no provider
   * call can hang past PROVIDER_HTTP_TIMEOUT_MS. Callers still get the
   * usual Response object on success; on timeout, the underlying AbortError
   * surfaces — subclasses already wrap verifyTransaction in try/catch.
   */
  async fetch(url, options = {}) {
    const { timeoutMs = PROVIDER_HTTP_TIMEOUT_MS, ...rest } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Provider HTTP timeout after ${timeoutMs}ms`)), timeoutMs);
    try {
      return await fetch(url, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Verify an inbound payment with the provider's API.
   * Returns { ok: boolean, status: 'success'|'pending'|'failed', amount, currency, phone, raw }.
   */
  // eslint-disable-next-line no-unused-vars
  async verifyTransaction(externalId) {
    throw new Error(`${this.constructor.name}.verifyTransaction() not implemented`);
  }

  /**
   * Initiate a collection (request-to-pay). Optional — not all providers support it.
   */
  // eslint-disable-next-line no-unused-vars
  async requestPayment(params) {
    throw new Error(`${this.constructor.name}.requestPayment() not implemented`);
  }

  /**
   * Validate the signature of an incoming webhook payload.
   * Default: reject (providers must override if they sign webhooks).
   */
  // eslint-disable-next-line no-unused-vars
  verifyWebhook(headers, rawBody) {
    return false;
  }

  /**
   * Parse a webhook body into a normalised event.
   * Returns { externalId, status, amount, currency, phone, raw }.
   */
  // eslint-disable-next-line no-unused-vars
  parseWebhook(body) {
    throw new Error(`${this.constructor.name}.parseWebhook() not implemented`);
  }
}

module.exports = BaseProvider;
