import { describe, expect, it } from 'vitest';

import type { OddsTier, Rarity } from '@/types/catalogue';

import { usd } from './money';
import { groupByRarity, mulberry32, pickFrom, sampleTier } from './odds';

const TIERS: OddsTier[] = [
  {
    rarity: 'ultra-rare',
    label: 'Ultra-Rare',
    probability: 0.002,
    valueRange: { min: usd(8001), max: usd(25_000) },
  },
  {
    rarity: 'rare',
    label: 'Rare',
    probability: 0.0072,
    valueRange: { min: usd(5001), max: usd(8000) },
  },
  {
    rarity: 'uncommon',
    label: 'Uncommon',
    probability: 0.0348,
    valueRange: { min: usd(1501), max: usd(5000) },
  },
  {
    rarity: 'common',
    label: 'Common',
    probability: 0.2108,
    valueRange: { min: usd(501), max: usd(1500) },
  },
  {
    rarity: 'base',
    label: 'Base',
    probability: 0.7452,
    valueRange: { min: usd(250), max: usd(500) },
  },
];

describe('mulberry32', () => {
  it('produces the same stream for the same seed', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const streamA = Array.from({ length: 20 }, a);
    const streamB = Array.from({ length: 20 }, b);
    expect(streamA).toEqual(streamB);
  });

  it('produces a different stream for a different seed', () => {
    const a = Array.from({ length: 20 }, mulberry32(1));
    const b = Array.from({ length: 20 }, mulberry32(2));
    expect(a).not.toEqual(b);
  });

  it('stays inside [0, 1)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 10_000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('sampleTier', () => {
  it('converges on the configured distribution over 100k samples', () => {
    const rng = mulberry32(20_260_902);
    const counts = new Map<Rarity, number>();
    const total = 100_000;

    for (let i = 0; i < total; i += 1) {
      const tier = sampleTier(rng, TIERS);
      counts.set(tier.rarity, (counts.get(tier.rarity) ?? 0) + 1);
    }

    for (const tier of TIERS) {
      const observed = (counts.get(tier.rarity) ?? 0) / total;
      // Within one percentage point of the configured probability.
      expect(Math.abs(observed - tier.probability)).toBeLessThan(0.01);
    }
  });

  it('never returns a tier outside the configured set', () => {
    const rng = mulberry32(7);
    const labels = new Set(TIERS.map((tier) => tier.label));
    for (let i = 0; i < 1000; i += 1) {
      expect(labels.has(sampleTier(rng, TIERS).label)).toBe(true);
    }
  });

  it('is reproducible for a given seed', () => {
    const first = Array.from({ length: 50 }, () => 0);
    const rngA = mulberry32(42);
    const rngB = mulberry32(42);
    const a = first.map(() => sampleTier(rngA, TIERS).rarity);
    const b = first.map(() => sampleTier(rngB, TIERS).rarity);
    expect(a).toEqual(b);
  });
});

describe('pickFrom', () => {
  it('throws on an empty list', () => {
    expect(() => pickFrom(mulberry32(1), [])).toThrow(RangeError);
  });

  it('only ever returns a member of the list', () => {
    const rng = mulberry32(3);
    const values = ['a', 'b', 'c'];
    for (let i = 0; i < 200; i += 1) {
      expect(values).toContain(pickFrom(rng, values));
    }
  });
});

describe('groupByRarity', () => {
  it('buckets items by rarity', () => {
    const grouped = groupByRarity([
      { rarity: 'base' } as never,
      { rarity: 'base' } as never,
      { rarity: 'rare' } as never,
    ]);
    expect(grouped.get('base')).toHaveLength(2);
    expect(grouped.get('rare')).toHaveLength(1);
    expect(grouped.get('ultra-rare')).toBeUndefined();
  });
});
