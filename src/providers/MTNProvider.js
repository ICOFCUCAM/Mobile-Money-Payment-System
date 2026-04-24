'use strict';

const BaseProvider = require('./BaseProvider');
const logger = require('../core/logger');
const { hmac, timingSafeEquals } = require('../core/encryption');

/**
 * MTN Mobile Money provider (MoMo Collection API).
 *
 * Real integration docs: https://momodeveloper.mtn.com/
 * We wrap the network call in a method that can be monkey-patched in tests and
 * gracefully degrades in sandbox/demo mode when the API is unreachable.
 */
class MTNProvider extends BaseProvider {
  static get id() {
    return 'MTN';
  }

  async _getAccessToken() {
    const { api_key: apiKey, api_secret: apiSecret } = this.credentials;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const res = await this.fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Ocp-Apim-Subscription-Key': this.metadata.subscriptionKey || apiKey
      }
    });
    if (!res.ok) throw new Error(`MTN token request failed: ${res.status}`);
    const json = await res.json();
    return json.access_token;
  }

  async verifyTransaction(externalId) {
    try {
      const token = await this._getAccessToken();
      const res = await this.fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(externalId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': this.metadata.environment || 'sandbox',
          'Ocp-Apim-Subscription-Key': this.metadata.subscriptionKey || this.credentials.api_key
        }
      });
      if (!res.ok) {
        return { ok: false, status: 'failed', raw: { httpStatus: res.status } };
      }
      const data = await res.json();
      const status =
        data.status === 'SUCCESSFUL' ? 'success' : data.status === 'FAILED' ? 'failed' : 'pending';
      return {
        ok: status === 'success',
        status,
        amount: data.amount ? Number(data.amount) : undefined,
        currency: data.currency,
        phone: data.payer && data.payer.partyId,
        raw: data
      };
    } catch (err) {
      logger.warn('MTN verifyTransaction failed', err.message);
      return { ok: false, status: 'failed', raw: { error: err.message } };
    }
  }

  verifyWebhook(headers, rawBody) {
    const signature = headers['x-momo-signature'] || headers['x-mtn-signature'];
    if (!signature) return false;
    const expected = hmac(this.credentials.api_secret, rawBody);
    return timingSafeEquals(signature, expected);
  }

  parseWebhook(body) {
    const status =
      body.status === 'SUCCESSFUL' ? 'success' : body.status === 'FAILED' ? 'failed' : 'pending';
    return {
      externalId: body.externalId || body.referenceId,
      status,
      amount: body.amount != null ? Number(body.amount) : undefined,
      currency: body.currency || 'XAF',
      phone: body.payer && (body.payer.partyId || body.payer.msisdn),
      raw: body
    };
  }
}

module.exports = MTNProvider;
