/*
 * Backup-password strength policy.
 *
 * This mirrors the Midnight SDK policy in @midnight-ntwrk/midnight-js-utils
 * (password-validation) so the UI can reject a weak password up-front with a
 * clear message instead of failing the export/import halfway through.
 *
 * The rules must stay in lock-step with the SDK's `validatePassword`. No
 * password values pass through here except the one the user typed; nothing is
 * logged or stored.
 */

export const MIN_BACKUP_PASSWORD_LENGTH = 16;
export const MIN_PASSWORD_CHARACTER_CLASSES = 3;
export const MAX_CONSECUTIVE_REPEATED = 3;
export const MIN_SEQUENTIAL_LENGTH = 4;

/** Count of the four character classes present (lower, upper, digit, symbol). */
export function countCharacterClasses(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count++;
  if (/[A-Z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[^a-zA-Z0-9]/.test(password)) count++;
  return count;
}

/** True when more than MAX_CONSECUTIVE_REPEATED identical chars appear in a row. */
export function hasRepeatedCharacters(password: string): boolean {
  let consecutiveCount = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      consecutiveCount++;
      if (consecutiveCount > MAX_CONSECUTIVE_REPEATED) return true;
    } else {
      consecutiveCount = 1;
    }
  }
  return false;
}

/** True when a run of MIN_SEQUENTIAL_LENGTH+ ascending/descending chars exists. */
export function hasSequentialPattern(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  for (let i = 0; i <= lowerPassword.length - MIN_SEQUENTIAL_LENGTH; i++) {
    let ascendingCount = 1;
    let descendingCount = 1;
    for (let j = 1; j < MIN_SEQUENTIAL_LENGTH; j++) {
      const currentCode = lowerPassword.charCodeAt(i + j);
      const prevCode = lowerPassword.charCodeAt(i + j - 1);
      if (currentCode === prevCode + 1) {
        ascendingCount++;
      } else {
        ascendingCount = 1;
      }
      if (currentCode === prevCode - 1) {
        descendingCount++;
      } else {
        descendingCount = 1;
      }
      if (ascendingCount >= MIN_SEQUENTIAL_LENGTH || descendingCount >= MIN_SEQUENTIAL_LENGTH) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates a user-supplied backup password. Returns an actionable message on
 * the first violated rule, or null when the password satisfies the policy.
 * An empty password is allowed: the export then uses the app's default
 * storage password instead.
 */
export function validateBackupPassword(password: string): string | null {
  if (password.length === 0) return null;
  if (password.length < MIN_BACKUP_PASSWORD_LENGTH) {
    return 'Your backup password must be at least 16 characters long. Leave it blank to use the app’s default storage password instead.';
  }
  if (hasRepeatedCharacters(password)) {
    return `Your backup password must not repeat the same character more than ${MAX_CONSECUTIVE_REPEATED} times in a row.`;
  }
  if (countCharacterClasses(password) < MIN_PASSWORD_CHARACTER_CLASSES) {
    return `Your backup password must mix at least ${MIN_PASSWORD_CHARACTER_CLASSES} of: uppercase letters, lowercase letters, digits, special characters.`;
  }
  if (hasSequentialPattern(password)) {
    return "Your backup password must not contain predictable sequences (e.g. '1234', 'abcd'). Use a more random password.";
  }
  return null;
}