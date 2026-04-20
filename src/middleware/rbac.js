'use strict';

const { ForbiddenError } = require('../core/errors');

/**
 * Role-based access control. Usage:
 *   router.post('/students', requireRole('admin','bursar'), handler)
 * Admins always pass.
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'));
    if (req.user.role === 'admin') return next();
    if (!roles.includes(req.user.role)) return next(new ForbiddenError(`Requires role: ${roles.join(', ')}`));
    next();
  };
}

module.exports = { requireRole };
