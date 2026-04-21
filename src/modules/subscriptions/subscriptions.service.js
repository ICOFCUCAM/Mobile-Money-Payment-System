'use strict';

const { v4: uuid } = require('uuid');
const { db, writeAudit } = require('../../core/database');
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

async function currentSubscription(schoolId) {
  const sRes = await db.query(
    'SELECT subscription_plan, subscription_status, subscription_expires_at FROM schools WHERE id = $1',
    [schoolId]
  );
  const school = sRes.rows[0];
  if (!school) throw new NotFoundError('School not found');

  const histRes = await db.query(
    'SELECT * FROM subscriptions WHERE school_id = $1 ORDER BY created_at DESC LIMIT 20',
    [schoolId]
  );
  return {
    plan: getPlan(school.subscription_plan),
    status: school.subscription_status,
    expiresAt: school.subscription_expires_at,
    history: histRes.rows
  };
}

/**
 * Change a school's plan. In production this integrates with Stripe / Flutterwave etc.
 * Here we accept a `paymentReference` the caller has already charged.
 */
async function changePlan(schoolId, payload, actor, ip) {
  const plan = getPlan(payload.plan);
  if (!plan) throw new ValidationError('Unknown plan');

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const subId = uuid();

  await db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO subscriptions (id, school_id, plan, status, expires_at, amount, currency)
       VALUES ($1, $2, $3, 'active', $4, $5, $6)`,
      [subId, schoolId, plan.id, expiresAt, plan.price || 0, plan.currency]
    );
    await client.query(
      `UPDATE schools
         SET subscription_plan = $1,
             subscription_status = 'active',
             subscription_expires_at = $2,
             updated_at = NOW()
       WHERE id = $3`,
      [plan.id, expiresAt, schoolId]
    );
  });

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
