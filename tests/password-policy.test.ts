/*
 * Guards that the app's backup-password validator (frontend/src/lib/password-policy.ts)
 * stays in lock-step with the Midnight SDK policy it mirrors
 * (@midnight-ntwrk/midnight-js-utils `validatePassword`).
 *
 * The UI must accept exactly the passwords the SDK accepts for non-blank
 * inputs — rejecting weaker passwords up-front is fine, but accepting anything
 * the SDK would reject would brick the export path later.
 */
import { describe, expect, it } from 'vitest';
import { validatePassword } from '../frontend/node_modules/@midnight-ntwrk/midnight-js-utils/dist/index.mjs';
import {
  MIN_BACKUP_PASSWORD_LENGTH,
  MIN_PASSWORD_CHARACTER_CLASSES,
  MAX_CONSECUTIVE_REPEATED,
  MIN_SEQUENTIAL_LENGTH,
  validateBackupPassword,
} from '../frontend/src/lib/password-policy';

const SDK = {
  MIN_PASSWORD_LENGTH: 16,
  MIN_CHARACTER_CLASSES: 3,
  MAX_CONSECUTIVE_REPEATED: 3,
  MIN_SEQUENTIAL_LENGTH: 4,
};

const sdksPasswordAccepted = (password: string): boolean => {
  try {
    validatePassword(password);
    return true;
  } catch {
    return false;
  }
};

describe('password-policy parity with the Midnight SDK', () => {
  it('keeps policy constants aligned with the SDK', () => {
    expect(MIN_BACKUP_PASSWORD_LENGTH).toBe(SDK.MIN_PASSWORD_LENGTH);
    expect(MIN_PASSWORD_CHARACTER_CLASSES).toBe(SDK.MIN_CHARACTER_CLASSES);
    expect(MAX_CONSECUTIVE_REPEATED).toBe(SDK.MAX_CONSECUTIVE_REPEATED);
    expect(MIN_SEQUENTIAL_LENGTH).toBe(SDK.MIN_SEQUENTIAL_LENGTH);
  });

  const cases: ReadonlyArray<readonly [password: string, note: string]> = [
    ['a', 'too short, one class'],
    ['short1!', 'too short'],
    ['Password1!', 'too short'],
    ['Password12345678!', 'sequential digits'],
    ['AAAAAAAAAAAAAAAA!', 'repeated characters'],
    ['Weakweakweakweak', 'only lower+ (upper) classes'],
    ['aaaaAAAA1111!!!!', 'repeated characters'],
    ['zxcvbnm,./!@#$%abcdef', 'lower + symbol only (2 classes)'],
    ['abcdefghijklmnop', 'one class'],
    ['abcd-EFGH-1234-wxyz-!9', 'sequential patterns'],
    ['K7!pTw9@zQ4#mN2&xR5', 'strong - must be accepted'],
    ['ab12-cd34-ef56-gh!A', 'strong - must be accepted'],
    ['Xyq7!b&kP2n@mWq9', 'strong - must be accepted'],
    ['r5!Vx7#Lm2@Qp9&Nw3$', 'strong - must be accepted'],
    ['A1b2C3d4E5f6G7h8I9!', 'strong - must be accepted'],
  ];

  it.each(cases)(
    'matched SDK acceptance for "%s" (%s)',
    (password) => {
      // Blank passwords are the one deliberate divergence: the app lets the
      // user leave the field empty to use the default storage password instead.
      const sdkAccepts = sdksPasswordAccepted(password);
      const appAccepts = validateBackupPassword(password) === null;
      expect(appAccepts).toBe(sdkAccepts);
    },
  );

  it('accepts a blank password by design (uses the default storage password)', () => {
    expect(validateBackupPassword('')).toBeNull();
  });
});