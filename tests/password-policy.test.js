'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { assertStrongPassword } = require('../src/utils/validators');

function assertRejects(pw, pattern) {
  assert.throws(() => assertStrongPassword(pw), pattern);
}
function assertAccepts(pw) {
  assert.doesNotThrow(() => assertStrongPassword(pw));
}

test('accepts reasonable passwords that mix classes', () => {
  assertAccepts('Correct-Horse-42');
  assertAccepts('sunflowerSTORM9');
  assertAccepts('!monsoon-CATHEDRAL-70');
});

test('rejects passwords shorter than 10 chars', () => {
  assertRejects('Abc1!xyz',  /at least 10/);
  assertRejects('short!1A',  /at least 10/);
});

test('rejects passwords above 200 chars', () => {
  assertRejects('A1!' + 'a'.repeat(210), /too long/);
});

test('rejects single-class passwords even when long', () => {
  assertRejects('aaaaaaaaaaaa',   /mix at least 3/);   // one class + repetition
  assertRejects('longlonglongpw', /mix at least 3/);   // only lowercase
  assertRejects('UPPERCASEONLY',  /mix at least 3/);   // only uppercase
  assertRejects('1234567890ab',   /patterned|mix at least 3/);
});

test('rejects two-class passwords (still below the 3-class bar)', () => {
  assertRejects('abcdefgHIJK',  /mix at least 3/);   // upper + lower only
});

test('rejects sequential runs ≥ 6', () => {
  assertRejects('Aabcdefg!1', /patterned/);          // abcdef ascending
  assertRejects('Z!987654Aa', /patterned/);          // 987654 descending
});

test('rejects all-same-character passwords', () => {
  assertRejects('!!!!!!!!!!', /mix at least 3|patterned/);
});

test('rejects known common passwords', () => {
  assertRejects('Password1!', /common-passwords blocklist/);
});

test('rejects non-string inputs', () => {
  assertRejects(undefined, /required/);
  assertRejects(null,      /required/);
  assertRejects(12345678,  /required/);
});

test('respects a custom field name in error messages', () => {
  assert.throws(
    () => assertStrongPassword('short', { field: 'newPassword' }),
    /newPassword must be at least 10/
  );
});
