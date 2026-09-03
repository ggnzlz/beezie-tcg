'use client';

import { useCallback, useEffect, useRef } from 'react';

// One Audio element, rewound on each play so rapid taps retrigger instead of queueing.
export function useClickSound(src: string, volume = 0.35) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src, volume]);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Autoplay policy can still refuse before any gesture; a silent no-op is fine.
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);
}
