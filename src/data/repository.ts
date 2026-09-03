import 'server-only';

import { unstable_cache } from 'next/cache';

import type { Item, Machine, PaymentMethod, RecentPullView } from '@/types/catalogue';
import type {
  PriceQuote,
  PurchaseInput,
  PurchaseSuccess,
  Result,
  SwapInput,
  SwapSuccess,
} from '@/types/operations';

import * as store from './store';

// The only seam between the UI and its data. Components import from here and
// never from `./mock`; the boundary is enforced by ESLint.

const CATALOGUE_REVALIDATE_SECONDS = 60;

/** Bounded artificial latency so pending and error states are observable. */
function settle<T>(value: T, minMs = 280, maxMs = 620): Promise<T> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

// Cacheable reads

export const getMachines = unstable_cache(
  async (): Promise<Machine[]> => store.listMachines(),
  ['machines'],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: ['catalogue'] },
);

export const getMachineBySlug = unstable_cache(
  async (slug: string): Promise<Machine | undefined> => store.findMachineBySlug(slug),
  ['machine-by-slug'],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: ['catalogue'] },
);

export const getTopItems = unstable_cache(
  async (machineId: string, limit?: number): Promise<Item[]> =>
    store.listTopItems(machineId, limit),
  ['top-items'],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: ['catalogue'] },
);

// Uncached reads

export async function getRecentPulls(machineId: string, limit?: number): Promise<RecentPullView[]> {
  const items = new Map(store.allItems().map((item) => [item.id, item]));
  return store
    .listRecentPulls(machineId, limit)
    .map(({ itemId, ...pull }) => {
      const item = items.get(itemId);
      return item ? { ...pull, item } : null;
    })
    .filter((pull): pull is RecentPullView => pull !== null);
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return store.listPaymentMethods();
}

export async function getQuote(
  machineSlug: string,
  quantity: number,
  promoCode?: string,
): Promise<PriceQuote | undefined> {
  const machine = store.findMachineBySlug(machineSlug);
  return machine ? store.quote(machine, quantity, promoCode) : undefined;
}

// Mutations

export async function purchasePulls(input: PurchaseInput): Promise<Result<PurchaseSuccess>> {
  return settle(store.purchase(input));
}

export async function swapItems(input: SwapInput): Promise<Result<SwapSuccess>> {
  return settle(store.swap(input));
}

export async function keepItems(input: SwapInput): Promise<Result<{ keptItemIds: string[] }>> {
  return settle(store.keep(input), 120, 260);
}

export async function validatePromoCode(code: string) {
  return settle(store.findPromoCode(code) ?? null, 180, 420);
}

export { OFFER_WINDOW_MS } from './store';
export type { PriceQuote } from '@/types/operations';
