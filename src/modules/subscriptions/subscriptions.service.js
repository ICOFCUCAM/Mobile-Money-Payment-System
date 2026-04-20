'use strict';

const { v4: uuid } = require('uuid');
const { getDb, writeAudit } = require('../../core/database');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { PLANS, getPlan } = require('./plans');

function listPlans() {
  return Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    interval: p.interval,
    features: {
      ...p.features,
      maxStudents: p.features.maxStudents === Infinity ? null : p.features.maxStudents
    }
  }));
}

function currentSubscription(schoolId) {
  const db = getDb();
  const school = db.prepare('SELECT subscription_plan, subscription_status, subscription_expires_at FROM schools WHERE id = ?').get(schoolId);
  if (!school) throw new NotFoundError('School not found');
  const history = db
    .prepare('SELECT * FROM subscriptions WHERE school_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(schoolId);
  return {
    plan: getPlan(school.subscription_plan),
    status: school.subscription_status,
    expiresAt: school.subscription_expires_at,
    history
  };
}

/**
 * Change a school's plan. In a real deployment this would integrate with Stripe / Flutterwave etc.
 * Here we accept a `paymentReference` the caller has already charged.
 */
function changePlan(schoolId, payload, actor, ip) {
  const plan = getPlan(payload.plan);
  if (!plan) throw new ValidationError('Unknown plan');

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subId = uuid();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO subscriptions (id, school_id, plan, status, expires_at, amount, currency)
       VALUES (?, ?, ?, 'active', ?, ?, ?)`
    ).run(subId, schoolId, plan.id, expiresAt, plan.price || 0, plan.currency);
    db.prepare(
      `UPDATE schools SET subscription_plan = ?, subscription_status = 'active', subscription_expires_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(plan.id, expiresAt, schoolId);
  });
  tx();

  writeAudit({
    schoolId,
    userId: actor && actor.id,
    action: 'subscription.change',
    entity: 'subscription',
    entityId: subId,
    metadata: { plan: plan.id, paymentReference: payload.paymentReference || null },
    ip
  });

  return currentSubscription(schoolId);
}

module.exports = { listPlans, currentSubscription, changePlan };
