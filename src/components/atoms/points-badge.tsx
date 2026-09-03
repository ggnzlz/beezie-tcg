import { cn } from '@/lib/utils';

export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <span className={cn('text-sm font-semibold text-accent tabular-nums', className)}>
      +{points.toLocaleString('en-US')} points
    </span>
  );
}
