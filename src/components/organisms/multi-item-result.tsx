'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import { Countdown } from '@/components/atoms/countdown';
import { Price } from '@/components/atoms/price';
import { RevealItemCard } from '@/components/molecules/reveal-item-card';
import { Button } from '@/components/ui/button';
import { sum, usd } from '@/lib/money';
import type { PulledItem } from '@/types/catalogue';

interface MultiItemResultProps {
  items: PulledItem[];
  expiresAt: number;
  pending: boolean;
  expired: boolean;
  onExpire: () => void;
  onSwap: (ids: string[]) => void;
}

export function MultiItemResult({
  items,
  expiresAt,
  pending,
  expired,
  onExpire,
  onSwap,
}: MultiItemResultProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectable = items.filter((pulled) => pulled.status !== 'swapped');
  const selectedItems = useMemo(
    () => items.filter((pulled) => selected.has(pulled.id) && pulled.status !== 'swapped'),
    [items, selected],
  );
  const selectionTotal = useMemo(
    () => (selectedItems.length ? sum(selectedItems.map((entry) => entry.swapValue)) : usd(0)),
    [selectedItems],
  );

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = selectable.length > 0 && selectedItems.length === selectable.length;

  return (
    <div className="flex h-full w-full flex-col gap-4 px-4 pt-14 pb-4 sm:px-6 lg:max-w-6xl">
      <ul className="grid scrollbar-slim min-h-0 flex-1 auto-rows-max grid-cols-2 content-start items-stretch gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {items.map((pulled, index) => (
          <motion.li
            key={pulled.id}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.32,
              delay: reduceMotion ? 0 : index * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="h-full"
          >
            <RevealItemCard
              pulled={pulled}
              selected={selected.has(pulled.id)}
              disabled={pending || expired}
              onToggle={() => toggle(pulled.id)}
              onSwap={() => onSwap([pulled.id])}
            />
          </motion.li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 pb-[max(0rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-foreground-muted">
          Expires in:{' '}
          <Countdown expiresAt={expiresAt} onExpire={onExpire} className="font-semibold" />
        </p>

        <div className="ml-auto flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-foreground-muted"
            disabled={expired || selectable.length === 0}
            onClick={() =>
              allSelected
                ? setSelected(new Set())
                : setSelected(new Set(selectable.map((entry) => entry.id)))
            }
          >
            {allSelected ? 'Clear' : 'Select all'}
          </Button>

          <Button
            type="button"
            disabled={selectedItems.length === 0 || pending || expired}
            onClick={() => onSwap(selectedItems.map((entry) => entry.id))}
            className="h-11 min-w-40 flex-1 text-sm font-semibold sm:flex-none"
          >
            {expired ? (
              'Offer expired'
            ) : selectedItems.length === 0 ? (
              'Swap'
            ) : (
              <>
                Swap {selectedItems.length} for{' '}
                <Price value={selectionTotal} className="text-inherit" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
