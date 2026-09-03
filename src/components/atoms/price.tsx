import { format, type Money } from '@/lib/money';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'value' | 'accent' | 'muted';

const TONES: Record<Tone, string> = {
  default: 'text-foreground',
  value: 'text-value',
  accent: 'text-accent',
  muted: 'text-foreground-muted',
};

interface PriceProps {
  value: Money;
  tone?: Tone;
  className?: string;
  /** Render exact cents even on whole amounts. */
  exact?: boolean;
}

export function Price({ value, tone = 'default', className, exact = false }: PriceProps) {
  return (
    <span className={cn('tabular-nums', TONES[tone], className)}>
      {format(value, { compactWholeUnits: !exact })}
    </span>
  );
}
