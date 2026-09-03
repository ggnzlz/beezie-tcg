'use client';

import { useEffect, useRef, useState } from 'react';

import type { Machine } from '@/types/catalogue';

// Refused autoplay and reduced motion both fall back to the poster, so the
// hero always renders at its final dimensions.
export function ClawHero({ machine }: { machine: Machine }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShowVideo(false);
      return;
    }
    videoRef.current?.play().catch(() => setShowVideo(false));
  }, []);

  return (
    <section
      aria-label={`${machine.name} machine`}
      className="relative mx-auto aspect-square h-full w-full max-w-[40rem] overflow-hidden rounded-2xl border border-border bg-surface-1 sm:aspect-4/3 xl:aspect-auto xl:min-h-[34rem] xl:max-w-none"
    >
      <video
        ref={videoRef}
        src={machine.media.idleVideo}
        poster={machine.media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="size-full object-cover"
        style={{ visibility: showVideo ? 'visible' : 'hidden' }}
      />

      {!showVideo ? (
        <div
          role="img"
          aria-label={`${machine.name} claw machine`}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${machine.media.poster})` }}
        />
      ) : null}
    </section>
  );
}
