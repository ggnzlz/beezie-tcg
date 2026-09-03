import { ItemImage } from '@/components/atoms/item-image';
import { Price } from '@/components/atoms/price';
import type { RecentPullView } from '@/types/catalogue';
import { cn } from '@/lib/utils';

export function RecentPullRow({ pull, className }: { pull: RecentPullView; className?: string }) {
  const fullTitle = `${pull.item.title} ${pull.item.gradingLabel}`;

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5',
        className,
      )}
    >
      <ItemImage src={pull.item.image} alt="" sizes="56px" className="size-14 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={fullTitle}>
          {fullTitle}
        </p>
        <p className="truncate text-xs text-foreground-muted">{pull.username}</p>
      </div>

      <Price value={pull.value} className="shrink-0 text-sm font-semibold" />
    </li>
  );
}
