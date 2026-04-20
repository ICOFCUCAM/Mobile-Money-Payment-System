'use strict';

/**
 * Abstract base class every payment provider must extend.
 *
 * Providers receive their per-school decrypted credentials in the constructor
 * so they never reach into the database themselves. Add a new provider by
 * subclassing this file and registering it in ProviderFactory.
 */
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
