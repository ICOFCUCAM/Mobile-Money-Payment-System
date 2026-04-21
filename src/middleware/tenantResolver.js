'use strict';

const { db } = require('../core/database');
const { AuthError, NotFoundError } = require('../core/errors');

/**
 * Resolves a tenant (school) from the request using, in priority order:
 *   1. The school already attached by auth middleware (JWT/API key).
 *   2. An explicit X-School-Slug header (admin-only flows).
 *   3. A subdomain on the host (e.g. `schoolA.app.com`).
 *
 * The resolved school is attached as `req.school` and its id as `req.schoolId`.
 */
async function tenantResolver(req, _res, next) {
  try {
    if (req.school) {
      req.schoolId = req.school.id;
      return next();
    }

    const slugHeader = req.headers['x-school-slug'];
    if (slugHeader) {
      const res = await db.query('SELECT * FROM schools WHERE slug = $1 AND is_active = TRUE', [slugHeader]);
      const school = res.rows[0];
      if (!school) throw new NotFoundError('School not found');
      req.school = school;
      req.schoolId = school.id;
      return next();
    }

    const host = (req.headers.host || '').split(':')[0];
    const parts = host.split('.');
    if (parts.length >= 3) {
      const slug = parts[0];
      const res = await db.query('SELECT * FROM schools WHERE slug = $1 AND is_active = TRUE', [slug]);
      const school = res.rows[0];
      if (school) {
        req.school = school;
        req.schoolId = school.id;
        return next();
      }
    }

    throw new AuthError('Unable to resolve tenant (school)');
  } catch (err) {
    next(err);
  }
}

module.exports = tenantResolver;
