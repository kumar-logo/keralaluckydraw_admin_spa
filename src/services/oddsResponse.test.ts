import { describe, it, expect } from 'vitest';
import { toOddsRows } from './oddsResponse';

interface Row { id: number; betType: string; odds: number }
const rows: Row[] = [
  { id: 411, betType: 'exact4', odds: 9000 },
  { id: 308, betType: 'exact5', odds: 90000 },
];

describe('toOddsRows', () => {
  it('REGRESSION: parses the real API shape { gameId, odds } that made every Odds tab empty', () => {
    expect(toOddsRows<Row>({ gameId: 801, odds: rows })).toEqual(rows);
  });

  it('still accepts a bare array', () => {
    expect(toOddsRows<Row>(rows)).toEqual(rows);
  });

  it('still accepts a paginated { list } shape', () => {
    expect(toOddsRows<Row>({ list: rows })).toEqual(rows);
  });

  it('returns empty for null/undefined/garbage instead of throwing', () => {
    expect(toOddsRows<Row>(null)).toEqual([]);
    expect(toOddsRows<Row>(undefined)).toEqual([]);
    expect(toOddsRows<Row>('nope')).toEqual([]);
    expect(toOddsRows<Row>({ gameId: 801 })).toEqual([]);
  });

  it('prefers odds over list when both are present', () => {
    expect(toOddsRows<Row>({ odds: rows, list: [] })).toEqual(rows);
  });
});
