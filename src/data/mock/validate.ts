import { machineSchema, paymentMethodSchema, promoCodeSchema, itemSchema } from '@/types/catalogue';
import type { Machine } from '@/types/catalogue';

import { PAYMENT_METHODS, PROMO_CODES } from './commerce';
import { ITEMS } from './items';
import { MACHINES } from './machines';

const PROBABILITY_TOLERANCE = 0.0001;

export class FixtureError extends Error {
  override name = 'FixtureError';
}

function assertOddsAreWellFormed(machine: Machine): void {
  const total = machine.odds.reduce((acc, tier) => acc + tier.probability, 0);
  if (Math.abs(total - 1) > PROBABILITY_TOLERANCE) {
    throw new FixtureError(
      `Machine "${machine.slug}" tier probabilities sum to ${total.toFixed(6)}, expected 1.`,
    );
  }

  // Ordered most common to rarest, ranges must not overlap.
  const ascending = [...machine.odds].sort(
    (a, b) => a.valueRange.min.amount - b.valueRange.min.amount,
  );
  for (let i = 1; i < ascending.length; i += 1) {
    const previous = ascending[i - 1]!;
    const current = ascending[i]!;
    if (current.valueRange.min.amount <= previous.valueRange.max.amount) {
      throw new FixtureError(
        `Machine "${machine.slug}" tiers "${previous.label}" and "${current.label}" have overlapping value ranges.`,
      );
    }
  }
}

function assertItemsExist(machine: Machine, itemIds: ReadonlySet<string>): void {
  for (const id of machine.itemIds) {
    if (!itemIds.has(id)) {
      throw new FixtureError(`Machine "${machine.slug}" references unknown item "${id}".`);
    }
  }
}

function assertEveryTierIsFillable(machine: Machine, rarities: ReadonlySet<string>): void {
  for (const tier of machine.odds) {
    if (!rarities.has(tier.rarity)) {
      throw new FixtureError(
        `Machine "${machine.slug}" can roll "${tier.label}" but no item has that rarity.`,
      );
    }
  }
}

// Runs at module import: a malformed distribution silently skews every pull.
export function validateFixtures(
  machines: readonly Machine[] = MACHINES,
  items: readonly unknown[] = ITEMS,
): void {
  const parsedItems = items.map((item) => itemSchema.parse(item));
  const itemIds = new Set(parsedItems.map((item) => item.id));
  const rarities = new Set(parsedItems.map((item) => item.rarity));

  for (const raw of machines) {
    const machine = machineSchema.parse(raw);
    assertOddsAreWellFormed(machine);
    assertItemsExist(machine, itemIds);
    assertEveryTierIsFillable(machine, rarities);
  }

  const slugs = new Set(machines.map((machine) => machine.slug));
  if (slugs.size !== machines.length) {
    throw new FixtureError('Machine slugs must be unique.');
  }

  PAYMENT_METHODS.forEach((method) => paymentMethodSchema.parse(method));
  PROMO_CODES.forEach((code) => promoCodeSchema.parse(code));
}

validateFixtures();
