import { usd } from '@/lib/money';
import type { PaymentMethod, PromoCode, RecentPull } from '@/types/catalogue';

import { ITEMS_BY_ID } from './items';

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: 'beezie-wallet',
    kind: 'beezie-wallet',
    label: 'Beezie wallet',
    // Deliberately short of a $500 pull so the insufficient-funds state is reachable.
    balance: usd(190),
  },
  {
    id: 'external-wallet',
    kind: 'external-wallet',
    label: 'External wallet',
    balance: usd(25_000),
  },
  {
    id: 'card',
    kind: 'card',
    label: 'Credit / Debit',
    note: 'Processing fees may apply',
  },
];

export const PROMO_CODES: readonly PromoCode[] = [
  {
    code: 'BEEZIE10',
    label: '10% off this order',
    discount: { kind: 'percentage', percent: 10 },
  },
  {
    code: 'FIRSTPULL',
    label: '$50 off your first pull',
    discount: { kind: 'fixed', amount: usd(50) },
  },
];

const USERNAMES = [
  'Lebnani',
  'grailhunter',
  'slabsonly',
  'kanto_kid',
  'vaulted',
  'mintcondition',
  'holo.eth',
  'pull_daddy',
];

// Fixed epoch rather than `Date.now()` so the module is deterministic at import
// time and cannot desync server and client rendering.
const SEED_EPOCH = 1_767_225_600_000;

const SEED_PULLS: ReadonlyArray<{ itemId: string; minutesAgo: number }> = [
  { itemId: 'bulbasaur-143', minutesAgo: 2 },
  { itemId: 'dedenne-gx-195a', minutesAgo: 6 },
  { itemId: 'alakazam-ex-201', minutesAgo: 11 },
  { itemId: 'mega-evolution-etb', minutesAgo: 17 },
  { itemId: 'latias-ex-239', minutesAgo: 24 },
  { itemId: 'gardevoir-ex-233', minutesAgo: 33 },
  { itemId: 'bulbasaur-143', minutesAgo: 41 },
  { itemId: 'ho-oh-ex-230', minutesAgo: 52 },
  { itemId: 'dedenne-gx-195a', minutesAgo: 63 },
  { itemId: 'rayquaza-vmax-218', minutesAgo: 78 },
  { itemId: 'mega-evolution-etb', minutesAgo: 94 },
  { itemId: 'umbreon-vmax-215', minutesAgo: 115 },
];

export function seedRecentPulls(machineId: string): RecentPull[] {
  return SEED_PULLS.map((pull, index) => ({
    id: `${machineId}-seed-${index}`,
    machineId,
    itemId: pull.itemId,
    username: USERNAMES[index % USERNAMES.length]!,
    value: ITEMS_BY_ID.get(pull.itemId)!.swapValue,
    pulledAt: SEED_EPOCH - pull.minutesAgo * 60_000,
  }));
}

export const RECENT_PULL_USERNAMES = USERNAMES;
