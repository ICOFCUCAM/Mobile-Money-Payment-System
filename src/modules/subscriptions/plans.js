'use strict';

/**
 * Canonical plan catalogue. The feature flags here drive the `planGuard`
 * middleware and the dashboard's feature gating. Edit this file to tweak
 * plan mechanics — there's no separate admin UI for it.
 */
const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 10,
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN'],
      maxStudents: 500,
      reports: false,
      webhooks: true,
      auditLogs: false,
      customBranding: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 25,
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN', 'ORANGE'],
      maxStudents: 5000,
      reports: true,
      webhooks: true,
      auditLogs: true,
      customBranding: false
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // custom quote
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN', 'ORANGE'],
      maxStudents: Infinity,
      reports: true,
      webhooks: true,
      auditLogs: true,
      customBranding: true
    }
  }
};

function getPlan(id) {
  return PLANS[id] || null;
}

module.exports = { PLANS, getPlan };
