'use strict';

class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class PlanRestrictionError extends AppError {
  constructor(message = 'Feature not available on your plan') {
    super(message, 402, 'PLAN_RESTRICTION');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PlanRestrictionError
};
