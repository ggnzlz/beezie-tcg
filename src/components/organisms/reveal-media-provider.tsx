'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

export type RevealReadiness = 'idle' | 'buffering' | 'ready' | 'degraded';

interface RevealMediaValue {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  readiness: RevealReadiness;
  /** True when the video path is unavailable and a CSS transition should be used. */
  useFallback: boolean;
  prime: () => void;
  play: () => Promise<boolean>;
  stop: () => void;
  onEnded: (handler: () => void) => () => void;
}

const RevealMediaContext = createContext<RevealMediaValue | null>(null);

export function useRevealMedia(): RevealMediaValue {
  const value = useContext(RevealMediaContext);
  if (!value) throw new Error('useRevealMedia must be used inside RevealMediaProvider');
  return value;
}

interface Connection {
  saveData?: boolean;
  effectiveType?: string;
}

function isConstrainedNetwork(): boolean {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  if (!connection) return false;
  return (
    connection.saveData === true ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g'
  );
}

const READY_TIMEOUT_MS = 2500;
const PARTIAL_BUFFER_GRACE_MS = 600;

// Mounts one hidden <video> for the whole page and keeps it warm. The reveal
// overlay adopts this exact element; remounting would throw away the buffer.
export function RevealMediaProvider({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readiness, setReadiness] = useState<RevealReadiness>('idle');
  // Toggling a class keeps the warmed element mounted.
  const [active, setActive] = useState(false);
  const [sources, setSources] = useState<{
    mp4: string;
    poster: string;
    /** The mobile asset is square; cover would crop most of it away on a phone. */
    fit: 'cover' | 'contain';
  } | null>(null);
  const primed = useRef(false);

  // Variant is chosen once; the reveal must not swap source mid-flight.
  // Buffering waits for page load so the video does not compete with critical assets.
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    const begin = () => {
      if (isConstrainedNetwork()) {
        setReadiness('degraded');
        return;
      }
      setSources(
        isMobile
          ? {
              mp4: '/media/reveal-mobile.mp4',
              poster: '/media/reveal-mobile-poster.webp',
              fit: 'contain',
            }
          : {
              mp4: '/media/reveal-desktop.mp4',
              poster: '/media/reveal-desktop-poster.webp',
              fit: 'cover',
            },
      );
      setReadiness('buffering');
    };

    const schedule = () => {
      if (started) return;
      started = true;
      const idle = window.requestIdleCallback;
      if (idle) idle(begin, { timeout: 1000 });
      else setTimeout(begin, 150);
    };

    let started = false;

    if (document.readyState === 'complete') {
      schedule();
      return;
    }

    // `load` can be held open indefinitely (dev HMR, a stalled asset), so a timer races it.
    window.addEventListener('load', schedule, { once: true });
    const fallback = setTimeout(schedule, 1200);

    return () => {
      window.removeEventListener('load', schedule);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || readiness === 'degraded') return;

    const onReady = () => setReadiness('ready');
    const onError = () => setReadiness('degraded');

    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('error', onError);

    const timeout = setTimeout(() => {
      setReadiness((current) => (current === 'buffering' ? 'degraded' : current));
    }, READY_TIMEOUT_MS);

    return () => {
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('error', onError);
      clearTimeout(timeout);
    };
  }, [readiness, sources]);

  // iOS only treats play() as user-initiated shortly after a real gesture, so
  // the first interaction is spent on a silent play/pause to unlock the element.
  const prime = useCallback(() => {
    if (primed.current) return;
    primed.current = true;
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => {
        video.pause();
        video.currentTime = 0;
      })
      .catch(() => {
        // Priming is best-effort; the fallback ladder covers the failure.
      });
  }, []);

  useEffect(() => {
    const onPrime = () => prime();
    window.addEventListener('beezie:prime-reveal', onPrime);
    return () => window.removeEventListener('beezie:prime-reveal', onPrime);
  }, [prime]);

  /** Resolves true only if playback actually started. */
  const play = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    if (!video || readiness === 'degraded') return false;

    if (readiness !== 'ready' && video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise((resolve) => setTimeout(resolve, PARTIAL_BUFFER_GRACE_MS));
    }

    try {
      video.currentTime = 0;
      setActive(true);
      // Confirm click still holds user activation, so unmuting is allowed. If
      // the browser refuses anyway, retry silent rather than losing the reveal.
      video.muted = false;
      video.volume = 0.85;
      try {
        await video.play();
      } catch {
        video.muted = true;
        await video.play();
      }
      return true;
    } catch {
      setActive(false);
      setReadiness('degraded');
      return false;
    }
  }, [readiness]);

  const stop = useCallback(() => {
    const video = videoRef.current;
    setActive(false);
    video?.pause();
    // Back to muted so the next gesture-priming play is never blocked.
    if (video) video.muted = true;
  }, []);

  const onEnded = useCallback((handler: () => void) => {
    const video = videoRef.current;
    if (!video) return () => undefined;
    video.addEventListener('ended', handler);
    return () => video.removeEventListener('ended', handler);
  }, []);

  const value = useMemo<RevealMediaValue>(
    () => ({
      videoRef,
      readiness,
      useFallback: readiness === 'degraded',
      prime,
      play,
      stop,
      onEnded,
    }),
    [readiness, prime, play, stop, onEnded],
  );

  return (
    <RevealMediaContext.Provider value={value}>
      {sources ? (
        <video
          ref={videoRef}
          src={sources.mp4}
          poster={sources.poster}
          muted
          playsInline
          preload={readiness === 'degraded' ? 'metadata' : 'auto'}
          aria-hidden
          data-testid="reveal-video"
          className={
            active
              ? cn(
                  'fixed inset-0 z-[70] size-full bg-black',
                  sources.fit === 'contain' ? 'object-contain' : 'object-cover',
                )
              : 'pointer-events-none fixed top-0 left-0 size-px opacity-0'
          }
        />
      ) : null}
      {children}
    </RevealMediaContext.Provider>
  );
}
