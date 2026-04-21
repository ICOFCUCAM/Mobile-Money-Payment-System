'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('./_helpers');
const { encrypt, decrypt, hmac, timingSafeEquals } = require('../src/core/encryption');

test('encrypt -> decrypt round-trips plaintext', () => {
  const original = 'sk_abcdef0123456789-super secret!';
  const enc = encrypt(original);
  assert.notEqual(enc, original);
  assert.equal(decrypt(enc), original);
});

test('encrypt produces a different ciphertext each call (unique IV)', () => {
  const a = encrypt('same');
  const b = encrypt('same');
  assert.notEqual(a, b);
  assert.equal(decrypt(a), 'same');
  assert.equal(decrypt(b), 'same');
});

test('tampered ciphertext fails GCM auth (does not decrypt silently)', () => {
  const enc = encrypt('secret');
  const tampered = Buffer.from(enc, 'base64');
  tampered[tampered.length - 1] ^= 0x01;
  const broken = tampered.toString('base64');
  assert.throws(() => decrypt(broken));
});

test('hmac + timingSafeEquals verify signatures deterministically', () => {
  const sig = hmac('k', 'body');
  assert.equal(timingSafeEquals(sig, hmac('k', 'body')), true);
  assert.equal(timingSafeEquals(sig, hmac('k', 'different')), false);
});
