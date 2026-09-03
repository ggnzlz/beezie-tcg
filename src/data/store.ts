import { add, isLessThan, money, multiply, percentageOf, subtract, sum, usd } from '@/lib/money';
import type { Money } from '@/lib/money';
import { groupByRarity, mulberry32, randomSeed, sampleItems } from '@/lib/odds';
import type {
  Item,
  Machine,
  PullResult,
  PulledItem,
  RecentPull,
  PaymentMethod,
} from '@/types/catalogue';
import type {
  OperationErrorCode,
  PriceQuote,
  PurchaseInput,
  PurchaseSuccess,
  Result,
  SwapInput,
  SwapSuccess,
} from '@/types/operations';
import { fail, ok } from '@/types/operations';

import { PAYMENT_METHODS, PROMO_CODES, seedRecentPulls } from './mock/commerce';
import { ITEMS, ITEMS_BY_ID } from './mock/items';
import { MACHINES } from './mock/machines';
import './mock/validate';

/** How long a reveal's swap offer stays open. */
export const OFFER_WINDOW_MS = 5 * 60_000;

const MAX_RECENT_PULLS = 40;

interface StoreState {
  balances: Map<string, Money>;
  inventory: Map<string, number>;
  recentPulls: Map<string, RecentPull[]>;
  results: Map<string, PullResult>;
}

function createState(): StoreState {
  return {
    balances: new Map(
      PAYMENT_METHODS.filter((method) => method.balance).map((method) => [
        method.id,
        method.balance!,
      ]),
    ),
    inventory: new Map(MACHINES.map((machine) => [machine.id, machine.inventoryRemaining])),
    recentPulls: new Map(MACHINES.map((machine) => [machine.id, seedRecentPulls(machine.id)])),
    results: new Map(),
  };
}

let state = createState();

/** Test hook. */
export function resetStore(): void {
  state = createState();
}

// Forces the next operation to fail so error and retry paths are demonstrable.
let forcedFailure: OperationErrorCode | null = null;

export function setForcedFailure(code: OperationErrorCode | null): void {
  forcedFailure = code;
}

export function getForcedFailure(): OperationErrorCode | null {
  return forcedFailure;
}

const FORCED_FAILURE_MESSAGES: Record<OperationErrorCode, string> = {
  'machine-not-found': 'That claw machine no longer exists.',
  'quantity-out-of-bounds': 'That quantity is not available.',
  'insufficient-funds': 'That payment method does not have enough funds.',
  'out-of-stock': 'This machine is restocking. Check back shortly.',
  'offer-expired': 'This swap offer has expired.',
  'already-swapped': 'One or more of those items has already been swapped.',
  'promo-invalid': 'That promo code is not valid.',
  unavailable: 'Something went wrong. Please try again.',
};

function takeForcedFailure(): Result<never> | null {
  if (!forcedFailure) return null;
  const code = forcedFailure;
  forcedFailure = null;
  return fail(code, FORCED_FAILURE_MESSAGES[code]);
}

export function listMachines(): Machine[] {
  return MACHINES.map((machine) => ({
    ...machine,
    inventoryRemaining: state.inventory.get(machine.id) ?? 0,
  }));
}

export function findMachineBySlug(slug: string): Machine | undefined {
  return listMachines().find((machine) => machine.slug === slug);
}

export function listTopItems(machineId: string, limit = 12): Item[] {
  const machine = MACHINES.find((entry) => entry.id === machineId);
  if (!machine) return [];
  return machine.itemIds
    .map((id) => ITEMS_BY_ID.get(id))
    .filter((item): item is Item => Boolean(item))
    .sort((a, b) => b.fairMarketValue.amount - a.fairMarketValue.amount)
    .slice(0, limit);
}

export function listRecentPulls(machineId: string, limit = 12): RecentPull[] {
  return (state.recentPulls.get(machineId) ?? []).slice(0, limit);
}

export function listPaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.map((method) =>
    method.balance
      ? { ...method, balance: state.balances.get(method.id) ?? method.balance }
      : method,
  );
}

export function findPromoCode(code: string) {
  return PROMO_CODES.find((promo) => promo.code.toLowerCase() === code.trim().toLowerCase());
}

export function quote(machine: Machine, quantity: number, promoCode?: string): PriceQuote {
  const subtotal = multiply(machine.unitPrice, quantity);
  const promo = promoCode ? findPromoCode(promoCode) : undefined;

  let discount = usd(0);
  if (promo) {
    discount =
      promo.discount.kind === 'percentage'
        ? percentageOf(subtotal, promo.discount.percent)
        : promo.discount.amount;
    // A fixed discount must never exceed the order or produce a negative total.
    if (discount.amount > subtotal.amount) discount = subtotal;
  }

  return {
    unitPrice: machine.unitPrice,
    quantity,
    subtotal,
    discount,
    total: subtract(subtotal, discount),
    pointsAwarded: machine.pointsPerPull * quantity,
  };
}

export function purchase(input: PurchaseInput): Result<PurchaseSuccess> {
  const forced = takeForcedFailure();
  if (forced) return forced;

  const machine = findMachineBySlug(input.machineSlug);
  if (!machine) {
    return fail('machine-not-found', 'That claw machine no longer exists.');
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return fail('quantity-out-of-bounds', 'Choose at least one pull.', 'quantity');
  }
  if (input.quantity > machine.maxQuantity) {
    return fail(
      'quantity-out-of-bounds',
      `You can buy up to ${machine.maxQuantity} pulls at a time.`,
      'quantity',
    );
  }

  const remaining = state.inventory.get(machine.id) ?? 0;
  if (remaining < input.quantity) {
    return fail('out-of-stock', 'This machine is restocking. Check back shortly.');
  }

  if (input.promoCode && !findPromoCode(input.promoCode)) {
    return fail('promo-invalid', 'That promo code is not valid.', 'promoCode');
  }

  const method = listPaymentMethods().find((entry) => entry.id === input.paymentMethodId);
  if (!method) {
    return fail('unavailable', 'Choose a payment method.', 'paymentMethod');
  }

  const pricing = quote(machine, input.quantity, input.promoCode);

  if (method.balance && isLessThan(method.balance, pricing.total)) {
    return fail(
      'insufficient-funds',
      `${method.label} does not have enough funds for this order.`,
      'paymentMethod',
    );
  }

  const seed = input.seed ?? randomSeed();
  const rng = mulberry32(seed);
  const obtainable = machine.itemIds
    .map((id) => ITEMS_BY_ID.get(id))
    .filter((item): item is Item => Boolean(item));

  const drawn = sampleItems(rng, {
    tiers: machine.odds,
    itemsByRarity: groupByRarity(obtainable),
    count: input.quantity,
  });

  const resultId = `pull-${seed >>> 0}-${state.results.size}`;
  const items: PulledItem[] = drawn.map((item, index) => ({
    id: `${resultId}-${index}`,
    item,
    swapValue: item.swapValue,
    status: 'pending',
  }));

  const now = Date.now();
  const result: PullResult = {
    id: resultId,
    machineId: machine.id,
    seed,
    items,
    expiresAt: now + OFFER_WINDOW_MS,
    chargedAmount: pricing.total,
    pointsAwarded: pricing.pointsAwarded,
  };

  state.results.set(result.id, result);
  state.inventory.set(machine.id, remaining - input.quantity);

  if (method.balance) {
    state.balances.set(method.id, subtract(method.balance, pricing.total));
  }

  recordPulls(machine.id, items, now);

  return ok({
    result,
    charged: pricing.total,
    discount: pricing.discount,
    pointsAwarded: pricing.pointsAwarded,
    ...(method.balance ? { walletBalance: state.balances.get(method.id)! } : {}),
  });
}

function recordPulls(machineId: string, items: readonly PulledItem[], now: number): void {
  const feed = state.recentPulls.get(machineId) ?? [];
  const entries: RecentPull[] = items.map((pulled, index) => ({
    id: `${pulled.id}-feed`,
    machineId,
    itemId: pulled.item.id,
    username: 'You',
    value: pulled.swapValue,
    pulledAt: now + index,
  }));
  state.recentPulls.set(machineId, [...entries.reverse(), ...feed].slice(0, MAX_RECENT_PULLS));
}

export function swap(input: SwapInput): Result<SwapSuccess> {
  const forced = takeForcedFailure();
  if (forced) return forced;

  const result = state.results.get(input.pullResultId);
  if (!result) {
    return fail('unavailable', 'That pull could not be found.');
  }
  if (Date.now() >= result.expiresAt) {
    return fail('offer-expired', 'This swap offer has expired. The items are yours to keep.');
  }
  if (input.pulledItemIds.length === 0) {
    return fail('unavailable', 'Select at least one item to swap.');
  }

  const targets: PulledItem[] = [];
  for (const id of input.pulledItemIds) {
    const pulled = result.items.find((entry) => entry.id === id);
    if (!pulled) {
      return fail('unavailable', 'That item is not part of this pull.');
    }
    if (pulled.status === 'swapped') {
      return fail('already-swapped', 'One or more of those items has already been swapped.');
    }
    targets.push(pulled);
  }

  const credited = sum(targets.map((pulled) => pulled.swapValue));

  for (const pulled of targets) {
    pulled.status = 'swapped';
  }

  const walletId = 'beezie-wallet';
  const balance = add(state.balances.get(walletId) ?? money(0), credited);
  state.balances.set(walletId, balance);

  return ok({
    credited,
    walletBalance: balance,
    swappedItemIds: targets.map((pulled) => pulled.id),
  });
}

export function keep(input: SwapInput): Result<{ keptItemIds: string[] }> {
  const result = state.results.get(input.pullResultId);
  if (!result) {
    return fail('unavailable', 'That pull could not be found.');
  }
  const kept: string[] = [];
  for (const pulled of result.items) {
    if (input.pulledItemIds.includes(pulled.id) && pulled.status === 'pending') {
      pulled.status = 'kept';
      kept.push(pulled.id);
    }
  }
  return ok({ keptItemIds: kept });
}

export function findResult(id: string): PullResult | undefined {
  return state.results.get(id);
}

export function allItems(): readonly Item[] {
  return ITEMS;
}
