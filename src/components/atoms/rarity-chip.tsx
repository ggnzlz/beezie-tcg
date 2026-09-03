import type { Rarity } from '@/types/catalogue';
import { cn } from '@/lib/utils';

const RARITY_CLASSES: Record<Rarity, string> = {
  'ultra-rare': 'bg-rarity-ultra-rare-bg text-rarity-ultra-rare',
  rare: 'bg-rarity-rare-bg text-rarity-rare',
  uncommon: 'bg-rarity-uncommon-bg text-rarity-uncommon',
  common: 'bg-rarity-common-bg text-rarity-common',
  base: 'bg-rarity-base-bg text-rarity-base',
};

export function rarityTextClass(rarity: Rarity): string {
  return RARITY_CLASSES[rarity].split(' ')[1]!;
}

export function rarityClasses(rarity: Rarity): string {
  return RARITY_CLASSES[rarity];
}

interface RarityChipProps {
  rarity: Rarity;
  label: string;
  className?: string;
}

export function RarityChip({ rarity, label, className }: RarityChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold',
        RARITY_CLASSES[rarity],
        className,
      )}
    >
      {label}
    </span>
  );
}
