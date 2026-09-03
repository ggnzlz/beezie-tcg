import Image from 'next/image';
import Link from 'next/link';

import { Price } from '@/components/atoms/price';
import type { Machine } from '@/types/catalogue';
import { cn } from '@/lib/utils';

interface MachineSwitcherTileProps {
  machine: Machine;
  isCurrent: boolean;
}

export function MachineSwitcherTile({ machine, isCurrent }: MachineSwitcherTileProps) {
  return (
    <Link
      href={`/claw/${machine.slug}`}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border bg-surface-2 p-3 transition-colors hover:bg-surface-3',
        isCurrent ? 'border-accent' : 'border-border',
      )}
    >
      <Image
        src={machine.media.thumbnail}
        alt=""
        width={96}
        height={96}
        className="size-10 object-contain"
      />
      <Price value={machine.unitPrice} className="text-sm font-semibold" />
      <span className="w-full truncate text-center text-[0.6875rem] text-foreground-muted">
        {machine.shortLabel}
      </span>
      {isCurrent ? <span className="sr-only">Currently viewing</span> : null}
    </Link>
  );
}
