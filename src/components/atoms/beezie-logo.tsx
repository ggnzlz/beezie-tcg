import { cn } from '@/lib/utils';

export function BeezieLogo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-6 text-accent" fill="currentColor">
        <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Zm0 3.2L6 8.6v6.8l6 3.4 6-3.4V8.6l-6-3.4Z" />
        <path d="M12 8.4 15.6 10.5v4.2L12 16.8 8.4 14.7v-4.2L12 8.4Z" opacity=".55" />
      </svg>
      <span className="text-[1.35rem] leading-none font-semibold tracking-tight">beezie</span>
    </span>
  );
}
