'use client';

import { motion, useReducedMotion } from 'motion/react';

import { ItemImage } from '@/components/atoms/item-image';
import { Price } from '@/components/atoms/price';
import { Button } from '@/components/ui/button';
import type { PulledItem } from '@/types/catalogue';

interface SingleItemResultProps {
  pulled: PulledItem;
  pending: boolean;
  expired: boolean;
  onSwap: () => void;
  onKeep: () => void;
}

export function SingleItemResult({
  pulled,
  pending,
  expired,
  onSwap,
  onKeep,
}: SingleItemResultProps) {
  const reduceMotion = useReducedMotion();
  const fullTitle = `${pulled.item.title} ${pulled.item.gradingLabel}`;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full max-w-4xl flex-col items-center gap-6 px-5 py-6 sm:gap-10 lg:flex-row lg:px-10"
    >
      <ItemImage
        src={pulled.item.image}
        alt={fullTitle}
        sizes="(min-width: 1024px) 400px, 62vw"
        priority
        className="w-[min(58vw,300px)] shrink-0 rounded-2xl shadow-overlay lg:w-100"
      />

      <div className="flex w-full flex-col gap-5 lg:gap-6">
        <h2 className="text-center text-lg leading-snug font-semibold text-balance sm:text-2xl lg:text-left lg:text-3xl">
          {fullTitle}
        </h2>

        <div className="text-center lg:text-left">
          <p className="text-sm text-foreground-muted">Swap Value</p>
          <Price
            value={pulled.swapValue}
            tone="accent"
            className="block text-4xl font-semibold sm:text-5xl"
          />
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Button
            type="button"
            onClick={onSwap}
            disabled={pending || expired}
            className="h-12 w-full text-base font-semibold"
          >
            {expired ? 'Offer expired' : pending ? 'Swapping…' : 'Swap Now'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onKeep}
            disabled={pending}
            className="h-12 w-full text-base font-semibold"
          >
            Keep Item
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
