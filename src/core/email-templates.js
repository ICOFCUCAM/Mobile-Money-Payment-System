'use strict';

/**
 * Email templates. Each exported function returns { subject, html, text }.
 *
 * Inline HTML is deliberate — no build step, no JSX, no MJML. Clients
 * render inconsistently, so keep the markup conservative: table layout,
 * inline styles, no background-image, no custom fonts. The text body is
 * a plain-text fallback for clients that refuse HTML.
 *
 * Colours match the dashboard: #0B5D3B SchoolPay green, #111 text.
 */

const BRAND = {
  name: 'SchoolPay',
  color: '#0B5D3B',
  text: '#111111',
  muted: '#666666',
  bg: '#fafafa'
};

function layout({ preheader, body }) {
  // preheader shows in the inbox preview pane. Keep ≤ 90 chars.
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ''}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;padding:32px;max-width:560px;">
        <tr><td>
          <div style="font-weight:700;color:${BRAND.color};font-size:20px;margin-bottom:24px;">${BRAND.name}</div>
          ${body}
          <div style="border-top:1px solid #eee;margin-top:32px;padding-top:16px;color:${BRAND.muted};font-size:12px;">
            You received this email because of activity on your ${BRAND.name} account. If this wasn't you, reply to this email.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcome({ schoolName, adminName }) {
  const preheader = `Your ${schoolName} workspace is ready on ${BRAND.name}.`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;">Welcome, ${adminName || 'there'}.</h1>
    <p style="line-height:1.6;margin:0 0 16px;">
      Your <strong>${schoolName}</strong> workspace is live on ${BRAND.name}.
      You can sign in, add bursars, import students, and start collecting fees.
    </p>
    <p style="line-height:1.6;margin:0 0 24px;color:${BRAND.muted};">
      A note: your API key was shown once during signup. If you lost it,
      you can rotate it from Settings — the old key stops working as soon
      as the new one is issued.
    </p>
  `;
  return {
    subject: `Welcome to ${BRAND.name}, ${schoolName}`,
    html: layout({ preheader, body }),
    text: `Welcome, ${adminName || 'there'}.\n\nYour ${schoolName} workspace is live on ${BRAND.name}. Sign in at your dashboard to add bursars, import students, and start collecting fees.\n\nIf you lost your API key, rotate it from Settings.`
  };
}

function passwordReset({ resetUrl, schoolName }) {
  const preheader = 'Reset your password — link expires in 1 hour.';
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;">Reset your password</h1>
    <p style="line-height:1.6;margin:0 0 16px;">
      Someone (hopefully you) asked to reset the password for your ${schoolName ? `<strong>${schoolName}</strong> ` : ''}${BRAND.name} account.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${resetUrl}" style="display:inline-block;background:${BRAND.color};color:white;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">Reset password</a>
    </p>
    <p style="line-height:1.6;margin:0 0 8px;color:${BRAND.muted};font-size:13px;">
      The link expires in 1 hour. If the button doesn't work, paste this URL into your browser:
    </p>
    <p style="line-height:1.4;margin:0 0 16px;color:${BRAND.muted};font-size:12px;word-break:break-all;">
      ${resetUrl}
    </p>
    <p style="line-height:1.6;margin:16px 0 0;color:${BRAND.muted};font-size:13px;">
      If you didn't ask for this, ignore this email — your password hasn't changed.
    </p>
  `;
  return {
    subject: `Reset your ${BRAND.name} password`,
    html: layout({ preheader, body }),
    text: `Reset your password\n\nVisit this link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`
  };
}

function paymentReceipt({ studentName, amount, currency, reference, schoolName, paidAt }) {
  const when = paidAt ? new Date(paidAt).toUTCString() : new Date().toUTCString();
  const amt = typeof amount === 'number' ? amount.toLocaleString() : amount;
  const preheader = `Receipt: ${amt} ${currency} for ${studentName}.`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;">Payment received</h1>
    <p style="line-height:1.6;margin:0 0 16px;">
      ${schoolName || BRAND.name} has received your payment. Keep this email — it's your receipt.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;margin:16px 0 24px;">
      <tr><td style="padding:12px 16px;color:${BRAND.muted};font-size:13px;">Student</td><td style="padding:12px 16px;text-align:right;font-weight:600;">${studentName}</td></tr>
      <tr><td style="padding:12px 16px;color:${BRAND.muted};font-size:13px;border-top:1px solid #eee;">Amount</td><td style="padding:12px 16px;text-align:right;font-weight:600;border-top:1px solid #eee;">${amt} ${currency}</td></tr>
      <tr><td style="padding:12px 16px;color:${BRAND.muted};font-size:13px;border-top:1px solid #eee;">Reference</td><td style="padding:12px 16px;text-align:right;font-family:ui-monospace,monospace;font-size:13px;border-top:1px solid #eee;">${reference}</td></tr>
      <tr><td style="padding:12px 16px;color:${BRAND.muted};font-size:13px;border-top:1px solid #eee;">Paid at</td><td style="padding:12px 16px;text-align:right;font-size:13px;border-top:1px solid #eee;">${when}</td></tr>
    </table>
    <p style="line-height:1.6;margin:0;color:${BRAND.muted};font-size:13px;">
      Questions? Reply to this email and the school will get in touch.
    </p>
  `;
  return {
    subject: `Receipt: ${amt} ${currency} — ${studentName}`,
    html: layout({ preheader, body }),
    text: `Payment received\n\nStudent: ${studentName}\nAmount: ${amt} ${currency}\nReference: ${reference}\nPaid at: ${when}\n\n${schoolName || BRAND.name} has received your payment. Keep this email as your receipt.`
  };
}

function lowBalanceAlert({ schoolName, balance, currency, threshold }) {
  const bal = typeof balance === 'number' ? balance.toLocaleString() : balance;
  const thr = typeof threshold === 'number' ? threshold.toLocaleString() : threshold;
  const preheader = `${schoolName} prepaid balance is low (${bal} ${currency}).`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;">Prepaid balance is running low</h1>
    <p style="line-height:1.6;margin:0 0 16px;">
      <strong>${schoolName}</strong>'s prepaid balance has dropped below ${thr} ${currency}.
    </p>
    <p style="line-height:1.6;margin:0 0 24px;">
      Current balance: <strong>${bal} ${currency}</strong>
    </p>
    <p style="line-height:1.6;margin:0 0 16px;">
      Top up from the dashboard to avoid interruptions — payments will continue
      to process normally until the balance is exhausted.
    </p>
  `;
  return {
    subject: `${schoolName} — prepaid balance low`,
    html: layout({ preheader, body }),
    text: `Prepaid balance is running low\n\n${schoolName}'s prepaid balance has dropped below ${thr} ${currency}.\nCurrent balance: ${bal} ${currency}\n\nTop up from the dashboard to avoid interruptions.`
  };
}

module.exports = { welcome, passwordReset, paymentReceipt, lowBalanceAlert };
