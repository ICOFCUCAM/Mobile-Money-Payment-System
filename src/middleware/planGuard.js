'use strict';

const { PlanRestrictionError } = require('../core/errors');
const { PLANS } = require('../modules/subscriptions/plans');

/**
 * Ensures the school's current plan grants a given feature/capability.
 * Example: router.post('/payments', requireFeature('providers.orange'), ...)
 */
function requireFeature(featurePath) {
  return (req, _res, next) => {
    if (!req.school) return next(new PlanRestrictionError('School context missing'));
    const plan = PLANS[req.school.subscription_plan] || PLANS.basic;
    const value = featurePath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), plan.features);
    if (!value) return next(new PlanRestrictionError(`Plan "${plan.id}" does not include "${featurePath}"`));
    next();
  };
}

/**
 * Ensures the school's plan permits the given payment provider.
 */
function requireProviderAllowed(req, _res, next) {
  const provider = (req.body && req.body.provider) || req.query.provider;
  if (!provider) return next();
  const plan = PLANS[req.school.subscription_plan] || PLANS.basic;
  if (!plan.features.providers.includes(provider)) {
    return next(new PlanRestrictionError(`Provider "${provider}" not available on the "${plan.id}" plan`));
  }
  next();
}

module.exports = { requireFeature, requireProviderAllowed };
