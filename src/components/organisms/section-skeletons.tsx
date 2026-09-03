import { Skeleton } from '@/components/ui/skeleton';

// Dimensions mirror the loaded sections so the swap costs no layout shift.

export function TopItemsGridSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <Skeleton className="mb-3 h-6 w-28" />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="rounded-xl border border-border bg-surface-2 p-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-1.5 px-1 pt-2 pb-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentPullsFeedSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <Skeleton className="mx-auto mb-3 h-6 w-32" />
      <ul className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5"
          >
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-14 shrink-0" />
          </li>
        ))}
      </ul>
    </section>
  );
}
