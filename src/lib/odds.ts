import type { Item, OddsTier, Rarity } from '@/types/catalogue';

export type Rng = () => number;

// mulberry32: small, fast and reproducible, so any outcome can be replayed.
export function mulberry32(seed: number): Rng {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) | 0;
}

/** Cumulative-weight sampling. Tiers are assumed validated to sum to 1. */
export function sampleTier(rng: Rng, tiers: readonly OddsTier[]): OddsTier {
  const roll = rng();
  let cumulative = 0;
  for (const tier of tiers) {
    cumulative += tier.probability;
    if (roll < cumulative) {
      return tier;
    }
  }
  // Only reachable through floating point slack at the very top of the range.
  return tiers[tiers.length - 1]!;
}

export function pickFrom<T>(rng: Rng, values: readonly T[]): T {
  if (values.length === 0) {
    throw new RangeError('Cannot pick from an empty list');
  }
  return values[Math.floor(rng() * values.length)]!;
}

export interface SampleItemsOptions {
  tiers: readonly OddsTier[];
  itemsByRarity: ReadonlyMap<Rarity, readonly Item[]>;
  count: number;
}

export function sampleItems(rng: Rng, { tiers, itemsByRarity, count }: SampleItemsOptions): Item[] {
  const pulled: Item[] = [];
  for (let i = 0; i < count; i += 1) {
    const tier = sampleTier(rng, tiers);
    const candidates = itemsByRarity.get(tier.rarity);
    if (!candidates || candidates.length === 0) {
      throw new RangeError(`No items available for rarity "${tier.rarity}"`);
    }
    pulled.push(pickFrom(rng, candidates));
  }
  return pulled;
}

export function groupByRarity(items: readonly Item[]): Map<Rarity, Item[]> {
  const grouped = new Map<Rarity, Item[]>();
  for (const item of items) {
    const bucket = grouped.get(item.rarity);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(item.rarity, [item]);
    }
  }
  return grouped;
}
