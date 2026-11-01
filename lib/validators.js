const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email.trim());
}

/** A payment amount must be a finite number, greater than 0, at most 150,000 (M-Pesa limit). */
export function isValidAmount(amount) {
  const n = typeof amount === 'string' && amount.trim() !== '' ? Number(amount) : amount;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 150000;
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

/**
 * Normalises a Kenyan phone number to 2547XXXXXXXX / 2541XXXXXXXX.
 * Returns null if the number is not valid.
 */
export function formatKenyanPhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  let normalized = null;
  if (/^0[17]\d{8}$/.test(digits)) normalized = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) normalized = `254${digits}`;
  else if (/^254[17]\d{8}$/.test(digits)) normalized = digits;
  return normalized;
}

/** Masks all but the last 3 digits so phone numbers are safe to log. */
export function maskPhone(phone) {
  if (typeof phone !== 'string' || phone.length < 6) return '***';
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}
