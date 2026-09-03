'use client';

import { useEffect, useRef, useState } from 'react';

import { RecentPullRow } from '@/components/molecules/recent-pull-row';
import type { RecentPullView } from '@/types/catalogue';

const POLL_INTERVAL_MS = 8000;

interface RecentPullsFeedProps {
  machineId: string;
  initialPulls: RecentPullView[];
}

// Entry animation is CSS rather than Motion: it is the only animated thing on
// the initial page and would otherwise pull the library into the first load.
export function RecentPullsFeed({ machineId, initialPulls }: RecentPullsFeedProps) {
  const [pulls, setPulls] = useState(initialPulls);
  const listRef = useRef<HTMLUListElement>(null);
  // Rows present at mount must not animate; only later arrivals should.
  const seededIds = useRef(new Set(initialPulls.map((pull) => pull.id)));

  useEffect(() => {
    setPulls(initialPulls);
    seededIds.current = new Set(initialPulls.map((pull) => pull.id));
  }, [initialPulls]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/pulls/recent?machineId=${encodeURIComponent(machineId)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { pulls: RecentPullView[] };
        if (cancelled) return;

        setPulls((current) => {
          const known = new Set(current.map((pull) => pull.id));
          const incoming = data.pulls.filter((pull) => !known.has(pull.id));
          if (incoming.length === 0) return current;

          // Prepending shifts content down; offset the scroll by the same amount.
          const list = listRef.current;
          const before = list?.scrollHeight ?? 0;
          queueMicrotask(() => {
            if (list && list.scrollTop > 0) {
              list.scrollTop += list.scrollHeight - before;
            }
          });

          return [...incoming, ...current].slice(0, 12);
        });
      } catch {
        // Offline or aborted — the feed simply keeps its current entries.
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [machineId]);

  return (
    <section
      aria-labelledby="recent-pulls-heading"
      className="flex h-full flex-col rounded-2xl border border-border bg-surface-1 p-4"
    >
      <h2 id="recent-pulls-heading" className="mb-3 text-center text-base font-semibold">
        Recent Pulls
      </h2>

      {pulls.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-muted">
          No pulls yet on this machine. Be the first.
        </p>
      ) : (
        <ul
          ref={listRef}
          tabIndex={0}
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Recent pulls list"
          className="scrollbar-slim max-h-[32rem] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
        >
          {pulls.map((pull) => (
            <RecentPullRow
              key={pull.id}
              pull={pull}
              className={
                seededIds.current.has(pull.id)
                  ? undefined
                  : 'animate-in duration-300 fade-in slide-in-from-top-2'
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
