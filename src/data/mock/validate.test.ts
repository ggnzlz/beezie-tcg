import { describe, expect, it } from 'vitest';

import { usd } from '@/lib/money';
import type { Machine } from '@/types/catalogue';

import { ITEMS } from './items';
import { MACHINES } from './machines';
import { FixtureError, validateFixtures } from './validate';

function clone(machine: Machine): Machine {
  return structuredClone(machine);
}

describe('fixtures', () => {
  it('parses every shipped machine and item against its schema', () => {
    expect(() => validateFixtures()).not.toThrow();
  });

  it('gives every machine at least twelve obtainable items', () => {
    for (const machine of MACHINES) {
      expect(machine.itemIds.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('covers every rarity tier with at least one item', () => {
    const rarities = new Set(ITEMS.map((item) => item.rarity));
    expect([...rarities].sort()).toEqual(['base', 'common', 'rare', 'ultra-rare', 'uncommon']);
  });

  it('keeps swap value below fair market value on every item', () => {
    for (const item of ITEMS) {
      expect(item.swapValue.amount).toBeLessThan(item.fairMarketValue.amount);
    }
  });

  it('rejects a distribution that does not sum to 1', () => {
    const corrupted = clone(MACHINES[0]!);
    corrupted.odds[0]!.probability += 0.05;
    expect(() => validateFixtures([corrupted], ITEMS)).toThrow(FixtureError);
    expect(() => validateFixtures([corrupted], ITEMS)).toThrow(/sum to 1\.05/);
  });

  it('rejects overlapping tier value ranges', () => {
    const corrupted = clone(MACHINES[0]!);
    corrupted.odds[4]!.valueRange.max = usd(2000);
    expect(() => validateFixtures([corrupted], ITEMS)).toThrow(/overlapping value ranges/);
  });

  it('rejects a machine referencing an unknown item', () => {
    const corrupted = clone(MACHINES[0]!);
    corrupted.itemIds = ['does-not-exist'];
    expect(() => validateFixtures([corrupted], ITEMS)).toThrow(/unknown item/);
  });

  it('rejects a tier no item can fill', () => {
    const corrupted = clone(MACHINES[0]!);
    const withoutUltraRare = ITEMS.filter((item) => item.rarity !== 'ultra-rare');
    corrupted.itemIds = withoutUltraRare.map((item) => item.id);
    expect(() => validateFixtures([corrupted], withoutUltraRare)).toThrow(
      /no item has that rarity/,
    );
  });
});
