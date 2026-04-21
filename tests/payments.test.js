'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const helpers = require('./_helpers');
const schoolsService = require('../src/modules/schools/schools.service');
const studentsService = require('../src/modules/students/students.service');
const paymentsService = require('../src/modules/payments/payments.service');

test.before(async () => helpers.ensureReady());
test.after(async () => helpers.teardown());

async function setup({ plan = 'pro' } = {}) {
  const slug = `s${helpers.uniq()}`;
  const { school } = await schoolsService.registerSchool({
    name: 'Acme', slug, email: `a-${slug}@x.edu`, adminName: 'A', password: 'supersecret', plan
  });
  await schoolsService.upsertPaymentConfig(school.id, {
    provider: 'MTN', api_key: 'k', api_secret: 's'
  });
  const student = await studentsService.createStudent(
    await schoolsService.getSchool(school.id),
    { studentCode: 'STU-001', fullName: 'Jane Doe' }
  );
  return { school: await schoolsService.getSchool(school.id), student };
}

test('submitTransaction verifies, records, and credits the student', async () => {
  const { school, student } = await setup();
  const tx = await paymentsService.submitTransaction(school, {
    studentCode: student.student_code,
    provider: 'MTN',
    externalId: `MoMo-${helpers.uniq()}`
  });
  assert.equal(tx.status, 'success');
  assert.equal(Number(tx.amount), 5000);

  const refreshed = await studentsService.getStudent(school.id, student.id);
  assert.equal(Number(refreshed.balance), 5000);
});

test('submitTransaction rejects duplicate (school, provider, externalId) — replay protection', async () => {
  const { school, student } = await setup();
  const externalId = `MoMo-${helpers.uniq()}`;
  await paymentsService.submitTransaction(school, {
    studentCode: student.student_code, provider: 'MTN', externalId
  });
  await assert.rejects(
    () => paymentsService.submitTransaction(school, {
      studentCode: student.student_code, provider: 'MTN', externalId
    }),
    (err) => err.code === 'CONFLICT'
  );
});

test('reverseTransaction debits the student back and marks the tx reversed', async () => {
  const { school, student } = await setup();
  const tx = await paymentsService.submitTransaction(school, {
    studentCode: student.student_code, provider: 'MTN', externalId: `MoMo-${helpers.uniq()}`
  });

  const after = await paymentsService.reverseTransaction(school, tx.id);
  assert.equal(after.status, 'reversed');

  const refreshed = await studentsService.getStudent(school.id, student.id);
  assert.equal(Number(refreshed.balance), 0);
});

test('reverseTransaction is idempotent (re-reversing is a no-op)', async () => {
  const { school, student } = await setup();
  const tx = await paymentsService.submitTransaction(school, {
    studentCode: student.student_code, provider: 'MTN', externalId: `MoMo-${helpers.uniq()}`
  });
  const first = await paymentsService.reverseTransaction(school, tx.id);
  const second = await paymentsService.reverseTransaction(school, tx.id);
  assert.equal(first.status, 'reversed');
  assert.equal(second.status, 'reversed');

  // Balance is debited exactly once even though reverse was called twice.
  const refreshed = await studentsService.getStudent(school.id, student.id);
  assert.equal(Number(refreshed.balance), 0);
});

test('reverseTransaction refuses non-success transactions', async () => {
  const { school, student } = await setup();
  helpers.stageMTN({ ok: false, status: 'failed', raw: { reason: 'denied' } });
  await assert.rejects(
    () => paymentsService.submitTransaction(school, {
      studentCode: student.student_code, provider: 'MTN', externalId: `MoMo-${helpers.uniq()}`
    })
  );
  // Fetch the failed tx that was just recorded.
  const list = await paymentsService.listTransactions(school.id, { status: 'failed' });
  assert.ok(list.length >= 1);
  await assert.rejects(
    () => paymentsService.reverseTransaction(school, list[0].id),
    (err) => err.code === 'VALIDATION_ERROR'
  );
});

test('recordWebhookTransaction is idempotent on the (school, provider, externalId) key', async () => {
  const { school, student } = await setup();
  const externalId = `wh-${helpers.uniq()}`;
  const body1 = JSON.stringify({ externalId, status: 'SUCCESSFUL', amount: 1000 });

  const first = await paymentsService.recordWebhookTransaction(
    school, 'MTN',
    { externalId, status: 'success', amount: 1000, currency: 'XAF', phone: student.phone, raw: { body: body1 } },
    body1
  );
  assert.equal(first.created, true);

  const second = await paymentsService.recordWebhookTransaction(
    school, 'MTN',
    { externalId, status: 'success', amount: 1000, currency: 'XAF', phone: student.phone, raw: { body: body1 } },
    body1
  );
  assert.equal(second.created, false); // already processed — no duplicate side effects
});

test('reconcilePending promotes a pending tx when the provider now reports success', async () => {
  const { school, student } = await setup();

  // Stage a pending result so the first submit records as pending.
  helpers.stageMTN({ ok: false, status: 'pending', raw: { still: 'checking' } });
  await assert.rejects(
    () => paymentsService.submitTransaction(school, {
      studentCode: student.student_code, provider: 'MTN', externalId: `rec-${helpers.uniq()}`
    })
  );
  const pendingList = await paymentsService.listTransactions(school.id, { status: 'pending' });
  assert.ok(pendingList.length >= 1);
  const txBefore = pendingList[0];

  // Next verify returns success — reconcile should pick it up and credit the student.
  helpers.stageMTN({ ok: true, status: 'success', amount: 2500, currency: 'XAF', raw: { ok: true } });
  const counts = await paymentsService.reconcilePending(school);
  assert.ok(counts.success >= 1);

  const refreshed = await studentsService.getStudent(school.id, student.id);
  assert.ok(Number(refreshed.balance) >= 2500);

  const after = await paymentsService.getTransaction(school.id, txBefore.id);
  assert.equal(after.status, 'success');
});
