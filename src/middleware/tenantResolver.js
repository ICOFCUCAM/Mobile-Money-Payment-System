'use strict';

const { getDb } = require('../core/database');
const { AuthError, NotFoundError } = require('../core/errors');

/**
 * Resolves a tenant (school) from the request using, in priority order:
 *   1. The school already attached by auth middleware (JWT/API key).
 *   2. An explicit X-School-Slug header (admin-only flows).
 *   3. A subdomain on the host (e.g. `schoolA.app.com`).
 *
 * The resolved school is attached as `req.school` and its id as `req.schoolId`.
 * Always runs AFTER auth, so we can cross-check tenant ownership.
 */
function tenantResolver(req, _res, next) {
  const db = getDb();

  // 1. Already attached by auth
  if (req.school) {
    req.schoolId = req.school.id;
    return next();
  }

  // 2. Header override
  const slugHeader = req.headers['x-school-slug'];
  if (slugHeader) {
    const school = db.prepare('SELECT * FROM schools WHERE slug = ? AND is_active = 1').get(slugHeader);
    if (!school) return next(new NotFoundError('School not found'));
    req.school = school;
    req.schoolId = school.id;
    return next();
  }

  // 3. Subdomain
  const host = (req.headers.host || '').split(':')[0];
  const parts = host.split('.');
  if (parts.length >= 3) {
    const slug = parts[0];
    const school = db.prepare('SELECT * FROM schools WHERE slug = ? AND is_active = 1').get(slug);
    if (school) {
      req.school = school;
      req.schoolId = school.id;
      return next();
    }
  }

  return next(new AuthError('Unable to resolve tenant (school)'));
}

module.exports = tenantResolver;
