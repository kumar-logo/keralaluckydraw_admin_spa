import { describe, it, expect } from 'vitest';
import {
  parsePositions,
  formatPositions,
  slatLabelSpan,
  deriveSlatLabels,
  usesSlatPricing,
  usesPick4Pricing,
  usesInsurance,
  defaultPositionColor,
  num,
  SlatMatchMode,
  DEFAULT_POSITION_PALETTE,
  type SlatProductDto,
  type SlatTierDto,
} from './digitShared';

describe('parsePositions (slat editor input parsing)', () => {
  it('parses a comma separated 0-based position list', () => {
    expect(parsePositions('0, 1, 2')).toEqual([0, 1, 2]);
  });

  it('tolerates extra whitespace and empty segments', () => {
    expect(parsePositions(' 0 ,, 2 , ')).toEqual([0, 2]);
  });

  it('drops non-integer / non-numeric fragments instead of producing NaN', () => {
    expect(parsePositions('0, x, 2.5, 3')).toEqual([0, 3]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parsePositions('')).toEqual([]);
  });

  it('round-trips through formatPositions', () => {
    expect(formatPositions(parsePositions('1, 2, 3'))).toBe('1, 2, 3');
  });
});

describe('slatLabelSpan', () => {
  it('takes the max of position count and label length', () => {
    const tier: SlatTierDto = {
      label: 'ABCD',
      positions: [0, 1],
      winAmount: 0,
      tierRank: 0,
    };
    expect(slatLabelSpan(tier)).toBe(4);
  });

  it('uses position count when it exceeds the label length', () => {
    const tier: SlatTierDto = {
      label: 'A',
      positions: [0, 1, 2],
      winAmount: 0,
      tierRank: 0,
    };
    expect(slatLabelSpan(tier)).toBe(3);
  });
});

describe('deriveSlatLabels (editor preview)', () => {
  it('returns empty (blank) labels when no tier exists', () => {
    expect(deriveSlatLabels(3, [])).toEqual(['', '', '']);
  });

  it('maps the widest tier label onto its positions', () => {
    const products: SlatProductDto[] = [
      {
        digitCount: 3,
        price: 10,
        matchMode: SlatMatchMode.Ladder,
        title: 'Straight',
        status: 1,
        tiers: [
          { label: 'ABC', positions: [0, 1, 2], winAmount: 100, tierRank: 0 },
        ],
      },
    ];
    expect(deriveSlatLabels(3, products)).toEqual(['A', 'B', 'C']);
  });
});

describe('game-type capability gates', () => {
  it('flags slat pricing only for three/four-five digit games', () => {
    expect(usesSlatPricing('three_digit')).toBe(true);
    expect(usesSlatPricing('four_five_digit')).toBe(true);
    expect(usesSlatPricing('kerala')).toBe(false);
  });

  it('flags pick4 pricing for four-five digit only', () => {
    expect(usesPick4Pricing('four_five_digit')).toBe(true);
    expect(usesPick4Pricing('three_digit')).toBe(false);
  });

  it('flags insurance for punjab only', () => {
    expect(usesInsurance('punjab')).toBe(true);
    expect(usesInsurance('kerala')).toBe(false);
  });
});

describe('defaultPositionColor', () => {
  it('returns the palette colour at the given position', () => {
    expect(defaultPositionColor(0)).toBe(DEFAULT_POSITION_PALETTE[0]);
    expect(defaultPositionColor(2)).toBe(DEFAULT_POSITION_PALETTE[2]);
  });

  it('wraps around the palette for out-of-range positions', () => {
    const wrapped = defaultPositionColor(DEFAULT_POSITION_PALETTE.length);
    expect(wrapped).toBe(DEFAULT_POSITION_PALETTE[0]);
  });
});

describe('num', () => {
  it('coerces nullish to zero', () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
  });

  it('coerces numeric strings', () => {
    expect(num('42')).toBe(42);
  });
});
