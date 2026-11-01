import { isValidEmail } from '../lib/validators.js';

export { isValidEmail };

/**
 * Formats an amount as Kenyan shillings, e.g. 1500 -> "KES 1,500" and
 * 1500.5 -> "KES 1,500.50". Throws on negative or non-numeric input.
 */
export function formatAmount(amount) {
  const n = typeof amount === 'string' && amount.trim() !== '' ? Number(amount) : amount;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TypeError('Amount must be a finite number');
  }
  if (n < 0) {
    throw new RangeError('Amount cannot be negative');
  }
  const hasCents = !Number.isInteger(n);
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `KES ${formatted}`;
}

/** "Hello World!  It's PayLink" -> "hello-world-its-paylink" */
export function slugify(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Shortens text to `max` characters, adding an ellipsis when it was cut. */
export function truncate(text, max = 50) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}
