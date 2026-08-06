/**
 * Sign-in identifiers.
 *
 * Firebase only has an email+password provider — there is no phone+password or
 * username+password. So every account is created under an email as far as
 * Firebase is concerned, and usernames and phone numbers are mapped onto
 * synthetic addresses on domains we own.
 *
 *   ada@example.com   -> ada@example.com          (used as-is)
 *   adalovelace       -> adalovelace@users.rootedbible.app
 *   +233 20 123 4567  -> 233201234567@phone.rootedbible.app
 *
 * A useful side effect: Firebase already enforces one account per email, so
 * usernames and phone numbers inherit that uniqueness for free.
 */

export type IdentifierKind = 'email' | 'username' | 'phone';

const USERNAME_DOMAIN = 'users.rootedbible.app';
const PHONE_DOMAIN = 'phone.rootedbible.app';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

export const USERNAME_RULES =
  '3–30 characters, using letters, numbers, underscore or full stop.';

/** Works out what the user typed, so one field can accept all three. */
export function detectIdentifierKind(raw: string): IdentifierKind {
  const value = raw.trim();

  if (value.includes('@')) return 'email';

  // A leading + or mostly digits reads as a phone number.
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+') || (digits.length >= 7 && digits.length / value.length > 0.7)) {
    return 'phone';
  }

  return 'username';
}

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

/** Digits only, so the same number always maps to the same account. */
export function normalizePhone(raw: string, countryCode = '') {
  const digits = raw.replace(/\D/g, '');
  const country = countryCode.replace(/\D/g, '');

  if (!digits) return '';
  if (raw.trim().startsWith('+')) return digits;
  if (!country) return digits;

  // Drop a national trunk prefix ("0244..." -> "244...") before prefixing.
  const national = digits.startsWith('0') ? digits.slice(1) : digits;
  return `${country}${national}`;
}

export type IdentifierResult =
  | { ok: true; kind: IdentifierKind; email: string; display: string }
  | { ok: false; message: string };

/**
 * Turns whatever the user typed into the email Firebase should authenticate.
 * `countryCode` is only consulted for phone input.
 */
export function resolveIdentifier(raw: string, countryCode = ''): IdentifierResult {
  const value = raw.trim();

  if (!value) {
    return { ok: false, message: 'Enter your email, username, or phone number.' };
  }

  const kind = detectIdentifierKind(value);

  if (kind === 'email') {
    const email = value.toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return { ok: false, message: 'That email address does not look right.' };
    }
    return { ok: true, kind, email, display: email };
  }

  if (kind === 'phone') {
    const digits = normalizePhone(value, countryCode);
    if (digits.length < 7) {
      return { ok: false, message: 'That phone number looks too short.' };
    }
    return { ok: true, kind, email: `${digits}@${PHONE_DOMAIN}`, display: `+${digits}` };
  }

  const username = normalizeUsername(value);
  if (!USERNAME_RE.test(username)) {
    return { ok: false, message: `Usernames are ${USERNAME_RULES}` };
  }
  return { ok: true, kind, email: `${username}@${USERNAME_DOMAIN}`, display: username };
}

/** True when the address is one of ours rather than a real inbox. */
export function isSyntheticEmail(email: string) {
  return email.endsWith(`@${USERNAME_DOMAIN}`) || email.endsWith(`@${PHONE_DOMAIN}`);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter.';
  if (!/[0-9]/.test(password)) return 'Include at least one number.';
  return null;
}
