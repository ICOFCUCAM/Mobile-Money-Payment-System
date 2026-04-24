/**
 * Client-side mirror of src/utils/validators.js assertStrongPassword.
 * Server is the authority — this exists purely for UX (tell users what's
 * wrong before they round-trip to the API).
 *
 * Kept tiny + dependency-free; update both files together when the policy
 * moves.
 */

const COMMON_PASSWORDS = new Set([
  'password1!', 'Password1!', 'Passw0rd!', 'Qwerty123!', 'Welcome1!',
  'Letmein1!', 'Admin1234!', 'Changeme1!', 'iloveyou1!', 'schoolpay1!',
]);

export type PasswordCheck = {
  ok: boolean;
  /** Plain-English reason. Empty when ok. */
  reason: string;
  /** 0 = empty, 1 = weak, 2 = okay, 3 = good, 4 = strong — for meter UI. */
  score: 0 | 1 | 2 | 3 | 4;
};

function classesUsed(pw: string): number {
  let n = 0;
  if (/[a-z]/.test(pw)) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

function isTriviallyPatterned(pw: string): boolean {
  if (/^(.)\1+$/.test(pw)) return true;
  for (let i = 0; i + 5 < pw.length; i++) {
    const chunk = pw.slice(i, i + 6);
    let asc = true, desc = true;
    for (let j = 1; j < chunk.length; j++) {
      if (chunk.charCodeAt(j) !== chunk.charCodeAt(j - 1) + 1) asc = false;
      if (chunk.charCodeAt(j) !== chunk.charCodeAt(j - 1) - 1) desc = false;
    }
    if (asc || desc) return true;
  }
  return false;
}

/** Run every rule; produce a user-friendly failure reason + a 0-4 score. */
export function checkPassword(pw: string): PasswordCheck {
  if (!pw) return { ok: false, reason: '', score: 0 };
  if (pw.length < 10) {
    return { ok: false, reason: 'Use at least 10 characters', score: 1 };
  }
  if (pw.length > 200) {
    return { ok: false, reason: 'Too long (max 200 characters)', score: 1 };
  }
  const classes = classesUsed(pw);
  if (classes < 3) {
    return {
      ok: false,
      reason: 'Mix at least 3 of: lowercase, UPPERCASE, digits, symbols',
      score: Math.min(2, classes) as 1 | 2,
    };
  }
  if (isTriviallyPatterned(pw)) {
    return { ok: false, reason: 'Avoid repeats and simple sequences like abcdef or 123456', score: 2 };
  }
  if (COMMON_PASSWORDS.has(pw)) {
    return { ok: false, reason: 'That one is on the common-passwords list — try something less guessable', score: 1 };
  }
  // Strength heuristic past the bar. Longer + 4 classes = 'strong'.
  const score = pw.length >= 16 && classes === 4 ? 4 : pw.length >= 12 && classes >= 3 ? 3 : 3;
  return { ok: true, reason: '', score: score as 3 | 4 };
}
