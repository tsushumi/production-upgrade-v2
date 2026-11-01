import { describe, it, expect } from 'vitest';
import { isValidEmail, formatAmount, slugify, truncate } from '../../utils/helpers.js';

describe('isValidEmail', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmail('brian@example.com')).toBe(true);
    expect(isValidEmail('a.b+c@mail.co.ke')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('plainaddress')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('spaces in@mail.com')).toBe(false);
  });
});

describe('formatAmount', () => {
  it('should format whole numbers with KES prefix', () => {
    expect(formatAmount(1500)).toBe('KES 1,500');
    expect(formatAmount('250')).toBe('KES 250');
  });

  it('should keep two decimals when the amount has cents', () => {
    expect(formatAmount(1500.5)).toBe('KES 1,500.50');
  });

  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('KES 0');
  });

  it('should throw on negative amounts', () => {
    expect(() => formatAmount(-1)).toThrow(RangeError);
  });

  it('should throw on non-numeric input', () => {
    expect(() => formatAmount('abc')).toThrow(TypeError);
    expect(() => formatAmount(NaN)).toThrow(TypeError);
    expect(() => formatAmount(undefined)).toThrow(TypeError);
  });
});

describe('slugify', () => {
  it('should convert spaces to hyphens and lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should strip punctuation, accents and surrounding separators', () => {
    expect(slugify("  Café -- It's PayLink!  ")).toBe('cafe-its-paylink');
  });

  it('should return an empty string for non-string input', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(42)).toBe('');
  });
});

describe('truncate', () => {
  it('should leave short text untouched and shorten long text', () => {
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('a very long description', 10)).toBe('a very ...');
    expect(truncate(undefined)).toBe('');
  });
});
