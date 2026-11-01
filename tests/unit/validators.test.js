import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidAmount,
  isValidPassword,
  formatKenyanPhone,
  maskPhone,
} from '../../lib/validators.js';

describe('Input Validators', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.co.ke')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@tld')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it('should accept valid payment amounts', () => {
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(1500.5)).toBe(true);
    expect(isValidAmount('250')).toBe(true);
    expect(isValidAmount(150000)).toBe(true);
  });

  it('should reject negative, zero, non-numeric and oversized amounts', () => {
    expect(isValidAmount(-50)).toBe(false);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(150001)).toBe(false);
  });

  it('should enforce password length rules', () => {
    expect(isValidPassword('password123')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword(12345678)).toBe(false);
  });
});

describe('Kenyan phone helpers', () => {
  it('should normalise local and international formats to 254 format', () => {
    expect(formatKenyanPhone('0712345678')).toBe('254712345678');
    expect(formatKenyanPhone('+254 712 345 678')).toBe('254712345678');
    expect(formatKenyanPhone('254112345678')).toBe('254112345678');
    expect(formatKenyanPhone('712345678')).toBe('254712345678');
  });

  it('should reject invalid phone numbers', () => {
    expect(formatKenyanPhone('12345')).toBeNull();
    expect(formatKenyanPhone('0212345678')).toBeNull();
    expect(formatKenyanPhone(null)).toBeNull();
  });

  it('should mask phone numbers for safe logging', () => {
    expect(maskPhone('254712345678')).toBe('2547****678');
    expect(maskPhone('123')).toBe('***');
  });
});
