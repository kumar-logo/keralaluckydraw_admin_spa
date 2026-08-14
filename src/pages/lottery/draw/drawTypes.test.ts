import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TICKET_LENGTH,
  DrawGameType,
  positionColorList,
  type PositionColorRow,
} from './drawTypes';

describe('DEFAULT_TICKET_LENGTH (result-entry digit counts)', () => {
  it('maps each draw family to its expected result length', () => {
    expect(DEFAULT_TICKET_LENGTH[DrawGameType.Kerala]).toBe(6);
    expect(DEFAULT_TICKET_LENGTH[DrawGameType.ThreeDigit]).toBe(3);
    expect(DEFAULT_TICKET_LENGTH[DrawGameType.FourFiveDigit]).toBe(5);
    expect(DEFAULT_TICKET_LENGTH[DrawGameType.Dubai]).toBe(1);
  });
});

describe('positionColorList (result-ball colours by index)', () => {
  it('returns an empty array when there are no rows', () => {
    expect(positionColorList()).toEqual([]);
    expect(positionColorList([])).toEqual([]);
  });

  it('places each colour at its declared position index', () => {
    const rows: PositionColorRow[] = [
      { position: 0, color: '#ff0000' },
      { position: 1, color: '#00ff00' },
      { position: 2, color: '#0000ff' },
    ];
    expect(positionColorList(rows)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
  });

  it('grows the array to the highest position and leaves gaps blank', () => {
    const rows: PositionColorRow[] = [{ position: 3, color: '#abcdef' }];
    const result = positionColorList(rows);
    expect(result).toHaveLength(4);
    expect(result[3]).toBe('#abcdef');
    expect(result[0]).toBe('');
  });
});
