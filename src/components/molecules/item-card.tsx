import { ItemImage } from '@/components/atoms/item-image';
import { Price } from '@/components/atoms/price';
import type { Item } from '@/types/catalogue';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: Item;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function ItemCard({ item, sizes, className, priority }: ItemCardProps) {
  const fullTitle = `${item.title} ${item.gradingLabel}`;

  return (
    <article
      className={cn(
        // `relative` keeps the absolutely positioned sr-only label inside the
        // scroll container, which otherwise inflates the page scroll height.
        'relative flex h-full flex-col gap-2 rounded-xl border border-border bg-surface-2 p-2',
        className,
      )}
    >
      <ItemImage src={item.image} alt={fullTitle} sizes={sizes} priority={priority} />

      <div className="mt-auto space-y-1 px-1 pb-1">
        {/* Two lines are always reserved so cards in a row end at the same height. */}
        <h3 className="line-clamp-2 min-h-8 text-xs leading-snug font-medium" title={fullTitle}>
          <span className="sr-only">{fullTitle}</span>
          <span aria-hidden>{fullTitle}</span>
        </h3>
        <p className="text-[0.6875rem] text-foreground-subtle">
          FMV <Price value={item.fairMarketValue} tone="value" className="font-semibold" />
        </p>
      </div>
    </article>
  );
}
