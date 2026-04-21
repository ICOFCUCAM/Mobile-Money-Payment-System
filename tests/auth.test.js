'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const helpers = require('./_helpers');
const schoolsService = require('../src/modules/schools/schools.service');
const authService = require('../src/modules/auth/auth.service');

test.before(async () => helpers.ensureReady());
test.after(async () => helpers.teardown());

async function makeSchool() {
  const slug = `s${helpers.uniq()}`;
  const email = `admin-${slug}@x.edu`;
  const reg = await schoolsService.registerSchool({
    name: 'Acme', slug, email, adminName: 'Admin', password: 'supersecret', plan: 'pro'
  });
  return { slug, email, school: reg.school };
}

test('login issues a JWT on correct credentials', async () => {
  const { email } = await makeSchool();
  const res = await authService.login({ email, password: 'supersecret' });
  assert.ok(res.token);
  assert.equal(res.user.email, email);
  assert.equal(res.user.role, 'admin');
});

test('login rejects wrong password without leaking which factor failed', async () => {
  const { email } = await makeSchool();
  await assert.rejects(
    () => authService.login({ email, password: 'wrong-password' }),
    (err) => err.code === 'AUTH_ERROR' && /invalid credentials/i.test(err.message)
  );
});

test('login rejects unknown email with the same error class', async () => {
  await assert.rejects(
    () => authService.login({ email: `ghost-${helpers.uniq()}@x.edu`, password: 'whatever' }),
    (err) => err.code === 'AUTH_ERROR'
  );
});

test('password reset: request returns ok even for unknown email (no enumeration)', async () => {
  const res = await authService.requestPasswordReset({ email: `ghost-${helpers.uniq()}@x.edu` });
  assert.equal(res.ok, true);
  assert.equal(res.token, undefined);
});

test('password reset flow: request -> confirm -> login with new password', async () => {
  process.env.PASSWORD_RESET_EXPOSE_TOKEN = '1';
  try {
    const { email, school } = await makeSchool();
    const req = await authService.requestPasswordReset({ email });
    assert.ok(req.token);

    await authService.resetPassword({ token: req.token, newPassword: 'brandnewpassword' });
    // Old password no longer works:
    await assert.rejects(() => authService.login({ email, password: 'supersecret' }));
    // New password works:
    const ok = await authService.login({ email, password: 'brandnewpassword' });
    assert.equal(ok.user.email, email);
    assert.equal(ok.school.id, school.id);
  } finally {
    delete process.env.PASSWORD_RESET_EXPOSE_TOKEN;
  }
});

test('password reset token is single-use', async () => {
  process.env.PASSWORD_RESET_EXPOSE_TOKEN = '1';
  try {
    const { email } = await makeSchool();
    const { token } = await authService.requestPasswordReset({ email });
    await authService.resetPassword({ token, newPassword: 'brandnewpassword' });
    await assert.rejects(
      () => authService.resetPassword({ token, newPassword: 'another-one' }),
      (err) => err.code === 'AUTH_ERROR'
    );
  } finally {
    delete process.env.PASSWORD_RESET_EXPOSE_TOKEN;
  }
});

test('requesting a new reset token invalidates any prior unused tokens', async () => {
  process.env.PASSWORD_RESET_EXPOSE_TOKEN = '1';
  try {
    const { email } = await makeSchool();
    const first = await authService.requestPasswordReset({ email });
    const second = await authService.requestPasswordReset({ email });
    assert.notEqual(first.token, second.token);
    // Using the now-invalidated first token must fail.
    await assert.rejects(
      () => authService.resetPassword({ token: first.token, newPassword: 'brandnewpassword' }),
      (err) => err.code === 'AUTH_ERROR'
    );
  } finally {
    delete process.env.PASSWORD_RESET_EXPOSE_TOKEN;
  }
});

test('changePassword requires the current password', async () => {
  const { email, school } = await makeSchool();
  const login = await authService.login({ email, password: 'supersecret' });

  await assert.rejects(
    () => authService.changePassword(login.user.id, {
      currentPassword: 'wrong',
      newPassword: 'brandnewpassword'
    }),
    (err) => err.code === 'AUTH_ERROR'
  );

  await authService.changePassword(login.user.id, {
    currentPassword: 'supersecret',
    newPassword: 'brandnewpassword'
  });

  const ok = await authService.login({ email, password: 'brandnewpassword' });
  assert.equal(ok.school.id, school.id);
});
