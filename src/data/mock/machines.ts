import { usd } from '@/lib/money';
import type { Machine, OddsTier } from '@/types/catalogue';

import { ALL_ITEM_IDS } from './items';

// The design's odds table sums to 100.52% and ranks Ultra-Rare above Rare, so
// this keeps its shape while summing to exactly 1 with the tiers ordered.
function tiers(scale: number): OddsTier[] {
  return [
    {
      rarity: 'ultra-rare',
      label: 'Ultra-Rare',
      probability: 0.002,
      valueRange: { min: usd(8001 * scale), max: usd(25_000 * scale) },
    },
    {
      rarity: 'rare',
      label: 'Rare',
      probability: 0.0072,
      valueRange: { min: usd(5001 * scale), max: usd(8000 * scale) },
    },
    {
      rarity: 'uncommon',
      label: 'Uncommon',
      probability: 0.0348,
      valueRange: { min: usd(1501 * scale), max: usd(5000 * scale) },
    },
    {
      rarity: 'common',
      label: 'Common',
      probability: 0.2108,
      valueRange: { min: usd(501 * scale), max: usd(1500 * scale) },
    },
    {
      rarity: 'base',
      label: 'Base',
      probability: 0.7452,
      valueRange: { min: usd(250 * scale), max: usd(500 * scale) },
    },
  ];
}

export const MACHINES: readonly Machine[] = [
  {
    id: 'machine-pokemon-gold',
    slug: 'pokemon-gold',
    name: 'Pokémon Gold Claw',
    shortLabel: 'Pokémon Gold',
    description:
      "Every pull is a statement piece, every grail secured with Brink's and tokenized on Beezie.",
    unitPrice: usd(500),
    pointsPerPull: 250,
    maxQuantity: 10,
    averageValue: usd(505),
    inventoryRemaining: 482,
    featured: true,
    media: {
      thumbnail: '/media/machine-gold.webp',
      poster: '/media/claw-poster.webp',
      idleVideo: '/media/claw-idle.mp4',
    },
    odds: tiers(1),
    itemIds: [...ALL_ITEM_IDS],
  },
  {
    id: 'machine-tcg-platinum',
    slug: 'tcg-platinum',
    name: 'TCG Platinum Claw',
    shortLabel: 'TCG Platinum',
    description:
      'Platinum-tier slabs only. Every pull is graded, vaulted and ready to trade the moment it lands.',
    unitPrice: usd(500),
    pointsPerPull: 250,
    maxQuantity: 10,
    averageValue: usd(512),
    inventoryRemaining: 216,
    featured: false,
    media: {
      thumbnail: '/media/machine-platinum.webp',
      poster: '/media/claw-poster.webp',
      idleVideo: '/media/claw-idle.mp4',
    },
    odds: tiers(1),
    itemIds: [...ALL_ITEM_IDS],
  },
  {
    id: 'machine-tcg-silver',
    slug: 'tcg-silver',
    name: 'TCG Silver Claw',
    shortLabel: 'TCG Silver',
    description:
      'The everyday claw. Lower stakes, same vault, same instant swap the second you reveal.',
    unitPrice: usd(100),
    pointsPerPull: 50,
    maxQuantity: 20,
    averageValue: usd(102),
    inventoryRemaining: 1340,
    featured: false,
    media: {
      thumbnail: '/media/machine-silver.webp',
      poster: '/media/claw-poster.webp',
      idleVideo: '/media/claw-idle.mp4',
    },
    odds: tiers(0.2),
    itemIds: [...ALL_ITEM_IDS],
  },
  {
    id: 'machine-wildcard',
    slug: 'wildcard',
    name: 'Wildcard Claw',
    shortLabel: 'Wildcard',
    description:
      'Thirty dollars, one pull, no idea what comes out. Restocks the moment it empties.',
    unitPrice: usd(30),
    pointsPerPull: 15,
    maxQuantity: 25,
    averageValue: usd(31),
    // Deliberately empty so the restocking state is reachable without editing code.
    inventoryRemaining: 0,
    featured: false,
    media: {
      thumbnail: '/media/machine-wildcard.webp',
      poster: '/media/claw-poster.webp',
      idleVideo: '/media/claw-idle.mp4',
    },
    odds: tiers(0.06),
    itemIds: [...ALL_ITEM_IDS],
  },
];

export const FEATURED_MACHINE_SLUG =
  MACHINES.find((machine) => machine.featured)?.slug ?? MACHINES[0]!.slug;
