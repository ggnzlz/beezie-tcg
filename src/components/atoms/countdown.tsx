'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

function remainingFrom(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

function formatDuration(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface CountdownProps {
  expiresAt: number;
  onExpire?: () => void;
  className?: string;
}

// Wall-clock arithmetic against an absolute timestamp: a decrementing counter
// drifts and stops when a mobile tab is backgrounded.
export function Countdown({ expiresAt, onExpire, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => remainingFrom(expiresAt));

  useEffect(() => {
    const tick = () => {
      const next = remainingFrom(expiresAt);
      setRemaining(next);
      if (next === 0) onExpire?.();
    };

    tick();
    const interval = setInterval(tick, 1000);
    // Re-sync on return so the value reflects real elapsed time, not tab time.
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [expiresAt, onExpire]);

  const expired = remaining === 0;

  return (
    <span
      role="timer"
      className={cn('tabular-nums', expired ? 'text-danger' : 'text-foreground-muted', className)}
    >
      {expired ? 'Expired' : formatDuration(remaining)}
    </span>
  );
}
