'use client';

import { Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Price } from '@/components/atoms/price';
import type { Money } from '@/lib/money';

export const WALLET_UPDATED_EVENT = 'beezie:wallet-updated';

export function emitWalletBalance(balance: Money) {
  window.dispatchEvent(new CustomEvent<Money>(WALLET_UPDATED_EVENT, { detail: balance }));
}

// The claw route is statically generated, so `router.refresh()` would re-serve
// the balance baked in at build time. The swap response is the live source.
export function WalletBalance({ initial }: { initial: Money }) {
  const [balance, setBalance] = useState(initial);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      setBalance((event as CustomEvent<Money>).detail);
    };
    window.addEventListener(WALLET_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(WALLET_UPDATED_EVENT, onUpdate);
  }, []);

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 sm:px-3">
      <Wallet aria-hidden className="size-4 text-foreground-muted" />
      <span className="sr-only">Wallet balance</span>
      <Price value={balance} className="text-sm font-semibold" />
    </div>
  );
}
