'use client';

import { CreditCard, Wallet } from 'lucide-react';

import { Price } from '@/components/atoms/price';
import { RadioGroupItem } from '@/components/ui/radio-group';
import type { Money } from '@/lib/money';
import type { PaymentMethod } from '@/types/catalogue';
import { cn } from '@/lib/utils';

interface PaymentMethodOptionProps {
  method: PaymentMethod;
  total: Money;
  selected: boolean;
}

export function PaymentMethodOption({ method, total, selected }: PaymentMethodOptionProps) {
  const insufficient = Boolean(method.balance && method.balance.amount < total.amount);
  const Icon = method.kind === 'card' ? CreditCard : Wallet;

  return (
    <label
      className={cn(
        'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
        selected ? 'border-accent bg-surface-3' : 'border-border bg-surface-2 hover:bg-surface-3',
        insufficient && 'opacity-80',
      )}
    >
      <RadioGroupItem value={method.id} id={`method-${method.id}`} className="shrink-0" />

      <Icon aria-hidden className="size-4 shrink-0 text-foreground-muted" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{method.label}</span>
        {method.note ? (
          <span className="block truncate text-xs text-foreground-subtle">{method.note}</span>
        ) : null}
        {insufficient ? (
          <span className="block text-xs text-danger">Insufficient funds</span>
        ) : null}
      </span>

      {method.balance ? (
        <Price value={method.balance} className="shrink-0 text-sm font-semibold" />
      ) : null}
    </label>
  );
}
