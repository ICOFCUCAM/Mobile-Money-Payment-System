'use strict';

/**
 * Transactional email via Resend — opt-in through RESEND_API_KEY.
 *
 * When the key is unset (local dev, preview deploys, tenants that don't
 * want us sending on their behalf), every send is a no-op that just logs
 * the intended dispatch. That means callers can sprinkle email.send calls
 * anywhere without guarding.
 *
 * Init is lazy + idempotent — the first send bootstraps the SDK; subsequent
 * sends reuse the client.
 *
 * Templates live in ./email-templates.js and are plain functions that
 * return { subject, html, text }. Keep them inline HTML — no build step,
 * no MJML, no JSX. School branding can override logo/colour via config.
 */

const logger = require('./logger');
const templates = require('./email-templates');

let client = null;
let initialised = false;
let enabled = false;

function init() {
  if (initialised) return enabled;
  initialised = true;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.info('Resend not configured (RESEND_API_KEY unset) — email sends will log-only');
    return false;
  }

  try {
    const { Resend } = require('resend');
    client = new Resend(key);
    enabled = true;
    logger.info('Resend initialised');
    return true;
  } catch (err) {
    logger.warn('Resend init failed — falling back to log-only', err && err.message);
    client = null;
    enabled = false;
    return false;
  }
}

/**
 * Default sender. Override with EMAIL_FROM for a verified-domain address
 * (onboarding@mg.schoolpay.cm, etc.). Until a domain is verified in Resend,
 * the dashboard-provided test address works for smoke testing.
 */
function defaultFrom() {
  return process.env.EMAIL_FROM || 'SchoolPay <onboarding@resend.dev>';
}

/**
 * Send a rendered email. Low-level — most callers should use the named
 * helpers below (sendWelcome, sendPasswordReset, ...) instead of calling
 * this directly.
 *
 * Always resolves. Never throws. Failures are logged and returned as
 * { ok: false, error } so callers can decide whether to surface them;
 * email failures must not roll back a DB write or break a request.
 */
async function send({ to, subject, html, text, from, replyTo }) {
  if (!to || !subject) return { ok: false, error: 'missing to/subject' };

  if (!init() || !client) {
    logger.info('email.send (log-only)', { to, subject });
    return { ok: true, simulated: true };
  }

  try {
    const res = await client.emails.send({
      from: from || defaultFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo
    });
    if (res && res.error) {
      logger.warn('email.send failed', { to, subject, error: res.error });
      return { ok: false, error: res.error };
    }
    logger.info('email.send ok', { to, subject, id: res && res.data && res.data.id });
    return { ok: true, id: res && res.data && res.data.id };
  } catch (err) {
    logger.error('email.send threw', err);
    return { ok: false, error: err && err.message };
  }
}

// --- Named helpers ---------------------------------------------------------

function sendWelcome({ to, schoolName, adminName }) {
  const rendered = templates.welcome({ schoolName, adminName });
  return send({ to, ...rendered });
}

function sendPasswordReset({ to, resetUrl, schoolName }) {
  const rendered = templates.passwordReset({ resetUrl, schoolName });
  return send({ to, ...rendered });
}

function sendPaymentReceipt({ to, studentName, amount, currency, reference, schoolName, paidAt }) {
  const rendered = templates.paymentReceipt({
    studentName, amount, currency, reference, schoolName, paidAt
  });
  return send({ to, ...rendered });
}

function sendLowBalanceAlert({ to, schoolName, balance, currency, threshold }) {
  const rendered = templates.lowBalanceAlert({ schoolName, balance, currency, threshold });
  return send({ to, ...rendered });
}

module.exports = {
  init,
  send,
  sendWelcome,
  sendPasswordReset,
  sendPaymentReceipt,
  sendLowBalanceAlert,
  get enabled() { return enabled; }
};
