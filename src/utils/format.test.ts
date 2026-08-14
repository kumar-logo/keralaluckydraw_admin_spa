import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMoneyShort,
  formatNumber,
  formatPercent,
  formatDateTime,
  formatDate,
  truncate,
  orDash,
  firstString,
  EM_DASH,
  CURRENCY_SYMBOL,
} from './format';

describe('formatMoney', () => {
  it('renders rupee symbol with two decimals using Indian grouping', () => {
    expect(formatMoney(1234567.5)).toBe('₹12,34,567.50');
  });

  it('coerces numeric strings', () => {
    expect(formatMoney('1000')).toBe('₹1,000.00');
  });

  it('returns an em dash for null, undefined and empty string', () => {
    expect(formatMoney(null)).toBe(EM_DASH);
    expect(formatMoney(undefined)).toBe(EM_DASH);
    expect(formatMoney('')).toBe(EM_DASH);
  });

  it('returns an em dash for non-finite values (guards money path)', () => {
    expect(formatMoney('not-a-number')).toBe(EM_DASH);
    expect(formatMoney(Number.NaN)).toBe(EM_DASH);
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe(EM_DASH);
  });

  it('does not treat zero as missing — zero is real money', () => {
    expect(formatMoney(0)).toBe('₹0.00');
  });

  it('adds a leading plus only for positive values when showSign is set', () => {
    expect(formatMoney(50, { showSign: true })).toBe('+₹50.00');
    // No explicit '+' for zero or negatives; the minus comes from the number itself.
    expect(formatMoney(0, { showSign: true })).toBe('₹0.00');
  });

  it('keeps the native minus sign after the symbol for negatives', () => {
    expect(formatMoney(-50, { showSign: true })).toBe('₹-50.00');
    expect(formatMoney(-50)).toBe('₹-50.00');
  });

  it('honors a custom currency symbol', () => {
    expect(formatMoney(10, { symbol: '$' })).toBe('$10.00');
  });
});

describe('formatMoneyShort', () => {
  it('abbreviates crores, lakhs and thousands', () => {
    expect(formatMoneyShort(25000000)).toBe('₹2.50Cr');
    expect(formatMoneyShort(150000)).toBe('₹1.50L');
    expect(formatMoneyShort(2500)).toBe('₹2.5K');
  });

  it('leaves small amounts fully formatted', () => {
    expect(formatMoneyShort(999)).toBe('₹999.00');
  });

  it('returns em dash for blank input', () => {
    expect(formatMoneyShort(null)).toBe(EM_DASH);
  });
});

describe('formatNumber', () => {
  it('formats integers with grouping and no decimals', () => {
    expect(formatNumber(1234567)).toBe('12,34,567');
  });

  it('returns em dash for invalid input', () => {
    expect(formatNumber('abc')).toBe(EM_DASH);
  });
});

describe('formatPercent', () => {
  it('appends a percent sign with default 2 decimals', () => {
    expect(formatPercent(12.5)).toBe('12.50%');
  });

  it('honors a custom fraction-digit count', () => {
    expect(formatPercent(33.333, 1)).toBe('33.3%');
  });

  it('returns em dash for missing input', () => {
    expect(formatPercent(undefined)).toBe(EM_DASH);
  });
});

describe('formatDateTime / formatDate', () => {
  it('formats a valid ISO timestamp', () => {
    expect(formatDate('2026-06-27T10:30:00Z')).toBe('2026-06-27');
  });

  it('renders a UTC instant in Asia/Kolkata 12h time', () => {
    expect(formatDateTime('2026-06-28T08:27:11Z')).toBe('2026-06-28 01:57:11 PM');
  });

  it('rolls the date forward when the IST offset crosses midnight', () => {
    expect(formatDate('2026-06-27T20:00:00Z')).toBe('2026-06-28');
  });

  it('returns em dash for falsy and invalid dates', () => {
    expect(formatDateTime(null)).toBe(EM_DASH);
    expect(formatDateTime('garbage')).toBe(EM_DASH);
    expect(formatDate('')).toBe(EM_DASH);
  });
});

describe('truncate', () => {
  it('truncates and appends an ellipsis past the limit', () => {
    expect(truncate('abcdefgh', 5)).toBe('abcde…');
  });

  it('leaves short strings untouched', () => {
    expect(truncate('abc', 5)).toBe('abc');
  });

  it('returns empty string for nullish input', () => {
    expect(truncate(null, 5)).toBe('');
  });
});

describe('orDash', () => {
  it('passes through real values including zero', () => {
    expect(orDash(0)).toBe('0');
    expect(orDash('hello')).toBe('hello');
  });

  it('returns em dash for null, undefined and empty string', () => {
    expect(orDash(null)).toBe(EM_DASH);
    expect(orDash(undefined)).toBe(EM_DASH);
    expect(orDash('')).toBe(EM_DASH);
  });
});

describe('firstString', () => {
  it('returns the first truthy string', () => {
    expect(firstString('', undefined, 'real', 'next')).toBe('real');
  });

  it('returns empty string when none are truthy', () => {
    expect(firstString('', undefined, null)).toBe('');
  });
});

describe('CURRENCY_SYMBOL', () => {
  it('is the rupee sign', () => {
    expect(CURRENCY_SYMBOL).toBe('₹');
  });
});
