import { format } from '@/lib/money';
import type { OddsTier as OddsTierModel } from '@/types/catalogue';

/** Formats "$8,001+" for the open-ended top tier, "$501 - $1,500" otherwise. */
function rangeLabel(tier: OddsTierModel, isTopTier: boolean): string {
  const min = format(tier.valueRange.min);
  return isTopTier ? `${min}+` : `${min} - ${format(tier.valueRange.max)}`;
}

interface OddsTierProps {
  tier: OddsTierModel;
  isTopTier: boolean;
}

export function OddsTier({ tier, isTopTier }: OddsTierProps) {
  const accent = `var(--rarity-${tier.rarity})`;
  const tint = `var(--rarity-${tier.rarity}-bg)`;

  return (
    <li
      className="flex flex-col gap-1 rounded-lg py-2 pr-2.5 pl-2.5"
      style={{
        // Solid rarity rail on the left, tint fading out across the row.
        borderLeft: `3px solid ${accent}`,
        backgroundImage: `linear-gradient(90deg, ${tint} 0%, color-mix(in oklch, ${tint} 40%, var(--surface-1)) 60%, var(--surface-1) 100%)`,
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[0.6875rem] font-semibold" style={{ color: accent }}>
          {tier.label}
        </span>
        <span
          className="shrink-0 text-[0.6875rem] font-semibold tabular-nums"
          style={{ color: accent }}
        >
          {(tier.probability * 100).toFixed(2)}%
        </span>
      </div>
      <span className="text-[0.6875rem] text-foreground-muted tabular-nums">
        {rangeLabel(tier, isTopTier)}
      </span>
    </li>
  );
}
