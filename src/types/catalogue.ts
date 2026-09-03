import { z } from 'zod';

/** Minor units, so every amount stays an integer end to end. */
export const moneySchema = z.object({
  amount: z.number().int(),
  currency: z.literal('USD'),
});

export const raritySchema = z.enum(['ultra-rare', 'rare', 'uncommon', 'common', 'base']);

export const oddsTierSchema = z.object({
  rarity: raritySchema,
  label: z.string().min(1),
  probability: z.number().gt(0).lte(1),
  valueRange: z
    .object({ min: moneySchema, max: moneySchema })
    .refine((range) => range.min.amount <= range.max.amount, {
      message: 'valueRange.min must be <= valueRange.max',
    }),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  gradingLabel: z.string().min(1),
  image: z.string().startsWith('/items/'),
  fairMarketValue: moneySchema,
  swapValue: moneySchema,
  rarity: raritySchema,
});

export const machineSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  shortLabel: z.string().min(1),
  description: z.string().min(1),
  unitPrice: moneySchema,
  pointsPerPull: z.number().int().nonnegative(),
  maxQuantity: z.number().int().positive(),
  averageValue: moneySchema,
  inventoryRemaining: z.number().int().nonnegative(),
  featured: z.boolean(),
  media: z.object({
    thumbnail: z.string().startsWith('/media/'),
    poster: z.string().startsWith('/media/'),
    idleVideo: z.string().startsWith('/media/'),
  }),
  odds: z.array(oddsTierSchema).min(2),
  itemIds: z.array(z.string().min(1)).min(1),
});

export const recentPullSchema = z.object({
  id: z.string().min(1),
  machineId: z.string().min(1),
  itemId: z.string().min(1),
  username: z.string().min(1),
  value: moneySchema,
  pulledAt: z.number().int().positive(),
});

export const paymentMethodSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['beezie-wallet', 'external-wallet', 'card']),
  label: z.string().min(1),
  /** Absent for card, which has no balance to check against. */
  balance: moneySchema.optional(),
  note: z.string().optional(),
});

export const promoCodeSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  discount: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('percentage'), percent: z.number().gt(0).lte(100) }),
    z.object({ kind: z.literal('fixed'), amount: moneySchema }),
  ]),
});

export const pulledItemStatusSchema = z.enum(['pending', 'swapped', 'kept']);

export const pulledItemSchema = z.object({
  /** Unique per pull — the same catalogue item can be pulled twice in one order. */
  id: z.string().min(1),
  item: itemSchema,
  swapValue: moneySchema,
  status: pulledItemStatusSchema,
});

export const pullResultSchema = z.object({
  id: z.string().min(1),
  machineId: z.string().min(1),
  seed: z.number().int(),
  items: z.array(pulledItemSchema).min(1),
  /** Absolute epoch ms — a decrementing counter drifts and stops when backgrounded. */
  expiresAt: z.number().int().positive(),
  chargedAmount: moneySchema,
  pointsAwarded: z.number().int().nonnegative(),
});

export type Rarity = z.infer<typeof raritySchema>;
export type OddsTier = z.infer<typeof oddsTierSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Machine = z.infer<typeof machineSchema>;
export type RecentPull = z.infer<typeof recentPullSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentMethodKind = PaymentMethod['kind'];
export type PromoCode = z.infer<typeof promoCodeSchema>;
export type PulledItem = z.infer<typeof pulledItemSchema>;
export type PulledItemStatus = z.infer<typeof pulledItemStatusSchema>;
export type PullResult = z.infer<typeof pullResultSchema>;

/** Rarest first — the order the odds panel renders tiers in. */
export const RARITY_ORDER: readonly Rarity[] = [
  'ultra-rare',
  'rare',
  'uncommon',
  'common',
  'base',
] as const;

export interface RecentPullView extends Omit<RecentPull, 'itemId'> {
  item: Item;
}
