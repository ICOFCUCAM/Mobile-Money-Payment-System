'use strict';

/**
 * Canonical plan catalogue. Drives the `planGuard` middleware and the
 * dashboard's feature gating.
 *
 * Billing models:
 *   • prepaid                  — per-student-per-year, $4 first 100 / $6 after
 *   • postpaid:basic|pro|enterprise  — monthly / yearly subscription
 *   • license:1|2|3-5|5-10|10p — one-off infrastructure purchase
 *
 * The older plan ids ('basic' / 'pro' / 'enterprise') resolve to their
 * postpaid counterparts for backward compatibility — the schools table
 * still stores them in the `subscription_plan` column.
 */
const POSTPAID = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 19,
    yearly: 190,
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN'],
      maxStudents: 150,
      reports: false,
      webhooks: true,
      auditLogs: false,
      customBranding: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    yearly: 490,
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN', 'ORANGE', 'AIRTEL'],
      maxStudents: 750,
      reports: true,
      webhooks: true,
      auditLogs: true,
      customBranding: false
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    yearly: 1490,
    currency: 'USD',
    interval: 'month',
    features: {
      providers: ['MTN', 'ORANGE', 'AIRTEL', 'BANK'],
      maxStudents: 3000,
      reports: true,
      webhooks: true,
      auditLogs: true,
      customBranding: true
    }
  }
};

const PREPAID = {
  prepaid: {
    id: 'prepaid',
    name: 'Prepaid',
    price: null,          // dynamic — computed per student
    currency: 'USD',
    interval: 'year',
    features: {
      providers: ['MTN', 'ORANGE'],
      maxStudents: 150,   // Prepaid caps at 150; over that, force upgrade
      reports: false,
      webhooks: true,
      auditLogs: false,
      customBranding: false
    }
  }
};

const LICENSE = {
  'license:1':    { id: 'license:1',    name: '1-school license',    price: 6000,  type: 'license', schools: 1,         features: licFeatures(1) },
  'license:2':    { id: 'license:2',    name: '2-school license',    price: 9000,  type: 'license', schools: 2,         features: licFeatures(2) },
  'license:3-5':  { id: 'license:3-5',  name: '3–5 school license',  price: 16000, type: 'license', schools: 5,         features: licFeatures(5) },
  'license:5-10': { id: 'license:5-10', name: '5–10 school license', price: 25000, type: 'license', schools: 10,        features: licFeatures(10) },
  'license:10p':  { id: 'license:10p',  name: '10+ school license',  price: null,  type: 'license', schools: Infinity,  features: licFeatures(Infinity), contactOnly: true }
};

function licFeatures(schools) {
  return {
    providers: ['MTN', 'ORANGE', 'AIRTEL', 'BANK'],
    maxStudents: Infinity,
    reports: true,
    webhooks: true,
    auditLogs: true,
    customBranding: true,
    selfHosted: true,
    multiSchool: schools
  };
}

const PLANS = { ...POSTPAID, ...PREPAID, ...LICENSE };

function getPlan(id) {
  return PLANS[id] || null;
}

/**
 * Resolve the effective plan record for a school row. Takes billing_model
 * + subscription_plan (+ license_tier when present) and returns the right
 * POSTPAID / PREPAID / LICENSE entry.
 */
function planForSchool(school) {
  const model = school.billing_model || 'postpaid';
  if (model === 'prepaid')  return PREPAID.prepaid;
  if (model === 'license')  return LICENSE[`license:${school.license_tier || '1'}`] || LICENSE['license:1'];
  return POSTPAID[school.subscription_plan] || POSTPAID.basic;
}

module.exports = { PLANS, POSTPAID, PREPAID, LICENSE, getPlan, planForSchool };
