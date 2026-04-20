'use strict';

const BaseProvider = require('./BaseProvider');
const logger = require('../core/logger');
const { hmac, timingSafeEquals } = require('../core/encryption');

/**
 * Orange Money provider (WebPay + Cash-in APIs).
 * Docs: https://developer.orange.com/apis/om-webpay/
 */
class OrangeProvider extends BaseProvider {
  static get id() {
    return 'ORANGE';
  }

  async _getAccessToken() {
    const { api_key: apiKey, api_secret: apiSecret } = this.credentials;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth/v3/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (!res.ok) throw new Error(`Orange token request failed: ${res.status}`);
    const json = await res.json();
    return json.access_token;
  }

  async verifyTransaction(externalId) {
    try {
      const token = await this._getAccessToken();
      const res = await fetch(
        `${this.baseUrl}/webpayment/v1/transactionstatus?order_id=${encodeURIComponent(externalId)}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );
      if (!res.ok) return { ok: false, status: 'failed', raw: { httpStatus: res.status } };
      const data = await res.json();
      const status =
        data.status === 'SUCCESS' || data.status === 'COMPLETED'
          ? 'success'
          : data.status === 'FAILED'
          ? 'failed'
          : 'pending';
      return {
        ok: status === 'success',
        status,
        amount: data.amount != null ? Number(data.amount) : undefined,
        currency: data.currency || 'XAF',
        phone: data.customer && data.customer.msisdn,
        raw: data
      };
    } catch (err) {
      logger.warn('Orange verifyTransaction failed', err.message);
      return { ok: false, status: 'failed', raw: { error: err.message } };
    }
  }

  verifyWebhook(headers, rawBody) {
    const signature = headers['x-orange-signature'];
    if (!signature) return false;
    const expected = hmac(this.credentials.api_secret, rawBody);
    return timingSafeEquals(signature, expected);
  }

  parseWebhook(body) {
    const status =
      body.status === 'SUCCESS' || body.status === 'COMPLETED'
        ? 'success'
        : body.status === 'FAILED'
        ? 'failed'
        : 'pending';
    return {
      externalId: body.order_id || body.txnid || body.transaction_id,
      status,
      amount: body.amount != null ? Number(body.amount) : undefined,
      currency: body.currency || 'XAF',
      phone: body.msisdn || (body.customer && body.customer.msisdn),
      raw: body
    };
  }
}

module.exports = OrangeProvider;
