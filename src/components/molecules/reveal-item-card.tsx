'use client';

import { Check, Plus } from 'lucide-react';

import { ItemImage } from '@/components/atoms/item-image';
import { Price } from '@/components/atoms/price';
import { format } from '@/lib/money';
import type { PulledItem } from '@/types/catalogue';
import { cn } from '@/lib/utils';

interface RevealItemCardProps {
  pulled: PulledItem;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSwap: () => void;
}

export function RevealItemCard({
  pulled,
  selected,
  disabled,
  onToggle,
  onSwap,
}: RevealItemCardProps) {
  const fullTitle = `${pulled.item.title} ${pulled.item.gradingLabel}`;
  const swapped = pulled.status === 'swapped';

  return (
    <article
      className={cn(
        'relative flex h-full flex-col gap-2.5 rounded-2xl border bg-surface-2 p-2.5 transition-colors',
        selected ? 'border-accent' : 'border-border',
        swapped && 'opacity-45',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || swapped}
        aria-pressed={selected}
        aria-label={`${selected ? 'Deselect' : 'Select'} ${fullTitle}`}
        className={cn(
          'absolute top-4 right-4 z-10 grid size-7 place-items-center rounded-full border transition-colors',
          selected
            ? 'border-accent bg-accent text-accent-foreground'
            : 'border-white/40 bg-black/35 text-white backdrop-blur-sm',
        )}
      >
        {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>

      <ItemImage
        src={pulled.item.image}
        alt={fullTitle}
        sizes="(min-width: 1024px) 220px, 42vw"
        className="rounded-xl"
      />

      {/* Two lines reserved so every card in a row ends at the same height. */}
      <h3 className="line-clamp-2 min-h-8 px-0.5 text-xs leading-snug font-medium">{fullTitle}</h3>

      <button
        type="button"
        onClick={onSwap}
        disabled={disabled || swapped}
        className={cn(
          'mt-auto h-9 rounded-lg text-xs font-semibold transition-colors',
          swapped
            ? 'bg-surface-3 text-foreground-muted'
            : 'bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-50',
        )}
      >
        {swapped ? (
          'Swapped'
        ) : (
          <>
            Swap for <Price value={pulled.swapValue} className="text-inherit" />
          </>
        )}
      </button>

      {swapped ? <span className="sr-only">Swapped for {format(pulled.swapValue)}</span> : null}
    </article>
  );
}
