'use client';

import { Minus, Plus } from 'lucide-react';

import { useClickSound } from '@/hooks/use-click-sound';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  onInteract?: () => void;
  className?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  onInteract,
  className,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const playClick = useClickSound('/audio/stepper-click.mp3');

  const change = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    onInteract?.();
    if (clamped !== value) playClick();
    onChange(clamped);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      change(value + 1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      change(value - 1);
    }
  };

  return (
    <div
      role="group"
      aria-label="Number of pulls"
      onKeyDown={onKeyDown}
      className={cn(
        'flex h-12 items-center rounded-xl border border-border bg-surface-2',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => change(value - 1)}
        disabled={atMin}
        aria-label="Decrease quantity"
        className="grid size-12 shrink-0 place-items-center rounded-l-xl text-foreground-muted hover:text-foreground disabled:opacity-35"
      >
        <Minus className="size-4" />
      </button>

      <output
        aria-live="polite"
        aria-atomic
        className="min-w-10 flex-1 text-center text-base font-semibold tabular-nums"
      >
        <span className="sr-only">{value} pulls selected</span>
        <span aria-hidden>{value}</span>
      </output>

      <button
        type="button"
        onClick={() => change(value + 1)}
        disabled={atMax}
        aria-label="Increase quantity"
        aria-describedby={atMax ? 'quantity-limit' : undefined}
        className="grid size-12 shrink-0 place-items-center rounded-r-xl text-foreground-muted hover:text-foreground disabled:opacity-35"
      >
        <Plus className="size-4" />
      </button>

      {atMax ? (
        <span id="quantity-limit" className="sr-only">
          Maximum of {max} pulls per order reached
        </span>
      ) : null}
    </div>
  );
}
