import { beforeEach, describe, expect, it } from 'vitest';

import { sum, usd } from '@/lib/money';

import {
  OFFER_WINDOW_MS,
  findMachineBySlug,
  keep,
  listPaymentMethods,
  purchase,
  quote,
  resetStore,
  setForcedFailure,
  swap,
} from './store';

const GOLD = 'pokemon-gold';
const WALLET = 'beezie-wallet';
const EXTERNAL = 'external-wallet';
const CARD = 'card';

function buy(overrides: Partial<Parameters<typeof purchase>[0]> = {}) {
  return purchase({
    machineSlug: GOLD,
    quantity: 1,
    paymentMethodId: EXTERNAL,
    seed: 12_345,
    ...overrides,
  });
}

beforeEach(() => {
  resetStore();
  setForcedFailure(null);
});

describe('quote', () => {
  it('multiplies unit price by quantity', () => {
    const machine = findMachineBySlug(GOLD)!;
    const pricing = quote(machine, 5);
    expect(pricing.subtotal.amount).toBe(250_000);
    expect(pricing.total.amount).toBe(250_000);
    expect(pricing.pointsAwarded).toBe(1250);
  });

  it('applies a percentage promo code', () => {
    const machine = findMachineBySlug(GOLD)!;
    const pricing = quote(machine, 2, 'BEEZIE10');
    expect(pricing.discount.amount).toBe(10_000);
    expect(pricing.total.amount).toBe(90_000);
  });

  it('applies a fixed promo code case-insensitively', () => {
    const machine = findMachineBySlug(GOLD)!;
    const pricing = quote(machine, 1, 'firstpull');
    expect(pricing.discount.amount).toBe(5000);
    expect(pricing.total.amount).toBe(45_000);
  });

  it('never lets a fixed discount produce a negative total', () => {
    const machine = findMachineBySlug('wildcard')!;
    const pricing = quote(machine, 1, 'FIRSTPULL');
    expect(pricing.total.amount).toBe(0);
    expect(pricing.discount.amount).toBe(machine.unitPrice.amount);
  });

  it('ignores an unknown code rather than crashing', () => {
    const machine = findMachineBySlug(GOLD)!;
    expect(quote(machine, 1, 'NOPE').discount.amount).toBe(0);
  });
});

describe('purchase', () => {
  it('returns exactly N items for quantity N', () => {
    for (const quantity of [1, 2, 5, 10]) {
      resetStore();
      const result = buy({ quantity });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.result.items).toHaveLength(quantity);
    }
  });

  it('is reproducible for a given seed', () => {
    const a = buy({ seed: 999 });
    resetStore();
    const b = buy({ seed: 999 });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.data.result.items.map((i) => i.item.id)).toEqual(
        b.data.result.items.map((i) => i.item.id),
      );
    }
  });

  it('returns the seed so an outcome can be reproduced', () => {
    const result = buy({ seed: 4242 });
    expect(result.ok && result.data.result.seed).toBe(4242);
  });

  it('sets an absolute expiry inside the offer window', () => {
    const before = Date.now();
    const result = buy();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.result.expiresAt).toBeGreaterThanOrEqual(before + OFFER_WINDOW_MS);
    }
  });

  it('rejects an unknown machine', () => {
    const result = buy({ machineSlug: 'does-not-exist' });
    expect(result).toMatchObject({ ok: false, code: 'machine-not-found' });
  });

  it('rejects a quantity below one', () => {
    expect(buy({ quantity: 0 })).toMatchObject({
      ok: false,
      code: 'quantity-out-of-bounds',
      field: 'quantity',
    });
  });

  it('rejects a quantity above the machine maximum', () => {
    const result = buy({ quantity: 11 });
    expect(result).toMatchObject({ ok: false, code: 'quantity-out-of-bounds' });
    if (!result.ok) expect(result.message).toContain('10');
  });

  it('rejects a non-integer quantity', () => {
    expect(buy({ quantity: 1.5 })).toMatchObject({ ok: false, code: 'quantity-out-of-bounds' });
  });

  it('rejects a machine with no inventory', () => {
    const result = buy({ machineSlug: 'wildcard' });
    expect(result).toMatchObject({ ok: false, code: 'out-of-stock' });
  });

  it('rejects an invalid promo code', () => {
    expect(buy({ promoCode: 'NOPE' })).toMatchObject({
      ok: false,
      code: 'promo-invalid',
      field: 'promoCode',
    });
  });

  it('rejects a wallet without enough funds', () => {
    // The Beezie wallet holds $190 against a $500 pull.
    expect(buy({ paymentMethodId: WALLET })).toMatchObject({
      ok: false,
      code: 'insufficient-funds',
      field: 'paymentMethod',
    });
  });

  it('allows card, which has no balance to check', () => {
    expect(buy({ paymentMethodId: CARD }).ok).toBe(true);
  });

  it('debits the wallet and decrements inventory', () => {
    const before = findMachineBySlug(GOLD)!.inventoryRemaining;
    const result = buy({ quantity: 2 });
    expect(result.ok).toBe(true);
    expect(findMachineBySlug(GOLD)!.inventoryRemaining).toBe(before - 2);

    const external = listPaymentMethods().find((m) => m.id === EXTERNAL)!;
    expect(external.balance!.amount).toBe(usd(25_000).amount - usd(1000).amount);
  });

  it('surfaces the pulled items at the top of the recent pulls feed', async () => {
    const result = buy();
    expect(result.ok).toBe(true);
    const { listRecentPulls } = await import('./store');
    const feed = listRecentPulls(findMachineBySlug(GOLD)!.id);
    expect(feed[0]!.username).toBe('You');
    if (result.ok) expect(feed[0]!.itemId).toBe(result.data.result.items[0]!.item.id);
  });

  it('honours a forced failure exactly once', () => {
    setForcedFailure('unavailable');
    expect(buy()).toMatchObject({ ok: false, code: 'unavailable' });
    expect(buy().ok).toBe(true);
  });
});

describe('swap', () => {
  function purchased(quantity = 4) {
    const result = buy({ quantity });
    if (!result.ok) throw new Error('purchase failed');
    return result.data.result;
  }

  it('credits the wallet with a single item swap value', () => {
    const pull = purchased(1);
    const before = listPaymentMethods().find((m) => m.id === WALLET)!.balance!;

    const result = swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.credited.amount).toBe(pull.items[0]!.swapValue.amount);
      expect(result.data.walletBalance.amount).toBe(before.amount + result.data.credited.amount);
    }
  });

  it('credits a batch swap with the sum of the selected swap values', () => {
    const pull = purchased(4);
    const selected = pull.items.slice(0, 3);
    const expected = sum(selected.map((entry) => entry.swapValue));

    const result = swap({
      pullResultId: pull.id,
      pulledItemIds: selected.map((entry) => entry.id),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.credited.amount).toBe(expected.amount);
      expect(result.data.swappedItemIds).toHaveLength(3);
    }
  });

  it('leaves unselected items actionable', () => {
    const pull = purchased(3);
    swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] });
    const second = swap({ pullResultId: pull.id, pulledItemIds: [pull.items[1]!.id] });
    expect(second.ok).toBe(true);
  });

  it('rejects swapping the same item twice', () => {
    const pull = purchased(2);
    swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] });
    expect(swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] })).toMatchObject({
      ok: false,
      code: 'already-swapped',
    });
  });

  it('rejects an empty selection', () => {
    const pull = purchased(2);
    expect(swap({ pullResultId: pull.id, pulledItemIds: [] })).toMatchObject({ ok: false });
  });

  it('rejects a swap after the offer expires', () => {
    const pull = purchased(1);
    pull.expiresAt = Date.now() - 1;
    expect(swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] })).toMatchObject({
      ok: false,
      code: 'offer-expired',
    });
  });

  it('does not credit anything when the swap is rejected', () => {
    const pull = purchased(1);
    pull.expiresAt = Date.now() - 1;
    const before = listPaymentMethods().find((m) => m.id === WALLET)!.balance!.amount;
    swap({ pullResultId: pull.id, pulledItemIds: [pull.items[0]!.id] });
    expect(listPaymentMethods().find((m) => m.id === WALLET)!.balance!.amount).toBe(before);
  });

  it('keeps items that are not swapped', () => {
    const pull = purchased(2);
    const result = keep({
      pullResultId: pull.id,
      pulledItemIds: pull.items.map((entry) => entry.id),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.keptItemIds).toHaveLength(2);
    expect(pull.items.every((entry) => entry.status === 'kept')).toBe(true);
  });
});
