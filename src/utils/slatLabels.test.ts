import { describe, it, expect } from 'vitest';
import { deriveSlatLabels, type SlatProductLike } from './slatLabels';

describe('deriveSlatLabels', () => {
  it('falls back to sequential A,B,C,... when no products are given', () => {
    expect(deriveSlatLabels(3)).toEqual(['A', 'B', 'C']);
    expect(deriveSlatLabels(5, null)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('returns a label array exactly the requested length', () => {
    expect(deriveSlatLabels(4)).toHaveLength(4);
  });

  it('places the longest tier label at its declared positions', () => {
    const products: SlatProductLike[] = [
      { tiers: [{ label: 'XYZ', positions: [0, 1, 2] }] },
    ];
    expect(deriveSlatLabels(3, products)).toEqual(['X', 'Y', 'Z']);
  });

  it('honors non-sequential positions and fills the gaps collision-free', () => {
    const products: SlatProductLike[] = [
      { tiers: [{ label: 'PQ', positions: [2, 0] }] },
    ];
    // label P -> index 2, Q -> index 0; remaining index 1 gets next free letter.
    const labels = deriveSlatLabels(3, products);
    expect(labels[2]).toBe('P');
    expect(labels[0]).toBe('Q');
    expect(labels[1]).not.toBe('P');
    expect(labels[1]).not.toBe('Q');
  });

  it('produces no duplicate labels (collision-free fill) — slat read integrity', () => {
    const products: SlatProductLike[] = [
      { tiers: [{ label: 'AB', positions: [0, 1] }] },
    ];
    const labels = deriveSlatLabels(5, products);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('chooses the tier with the widest span across multiple products', () => {
    const products: SlatProductLike[] = [
      { tiers: [{ label: 'A', positions: [0] }] },
      { tiers: [{ label: 'WXYZ', positions: [0, 1, 2, 3] }] },
    ];
    expect(deriveSlatLabels(4, products)).toEqual(['W', 'X', 'Y', 'Z']);
  });
});
