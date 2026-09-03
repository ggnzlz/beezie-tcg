'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { keepAction, swapAction } from '@/app/claw/[slug]/actions';
import { Price } from '@/components/atoms/price';
import { emitWalletBalance } from '@/components/molecules/wallet-balance';
import { useClawExperience } from '@/components/organisms/claw-experience-provider';
import { MultiItemResult } from '@/components/organisms/multi-item-result';
import { useRevealMedia } from '@/components/organisms/reveal-media-provider';
import { SingleItemResult } from '@/components/organisms/single-item-result';
import type { Money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PulledItem } from '@/types/catalogue';

/** Source clips run ~5.7s; this only fires if `ended` never arrives. */
const REVEAL_TIMEOUT_MS = 9000;

export function RevealOverlay() {
  const { phase, result, finishReveal, dismissResult, reset } = useClawExperience();
  const { play, stop, onEnded, useFallback } = useRevealMedia();
  const reduceMotion = useReducedMotion();

  const [items, setItems] = useState<PulledItem[]>([]);
  const [pending, setPending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [credited, setCredited] = useState<Money | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const open = phase === 'revealing' || phase === 'result';

  useEffect(() => {
    if (result) setItems(result.items);
    // Clear per-pull state, or the previous pull's toast and expiry flag leak in.
    setCredited(null);
    setExpired(false);
    setPending(false);
  }, [result]);

  // Start playback when the overlay opens, or skip through when video is
  // unavailable or motion is reduced.
  useEffect(() => {
    if (phase !== 'revealing') return;

    if (useFallback || reduceMotion) {
      const timer = setTimeout(finishReveal, 420);
      return () => clearTimeout(timer);
    }

    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let detach: (() => void) | undefined;

    performance.mark('reveal:overlay-open');

    void play().then((started) => {
      if (cancelled) return;

      if (!started) {
        // Playback refused; without this the user is stranded on the reveal.
        fallbackTimer = setTimeout(finishReveal, 420);
        return;
      }

      performance.mark('reveal:first-frame');
      performance.measure(
        'reveal:time-to-first-frame',
        'reveal:overlay-open',
        'reveal:first-frame',
      );

      detach = onEnded(() => {
        stop();
        finishReveal();
      });

      // Last-resort guard: if `ended` never arrives, advance anyway.
      fallbackTimer = setTimeout(() => {
        stop();
        finishReveal();
      }, REVEAL_TIMEOUT_MS);
    });

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      detach?.();
    };
  }, [phase, useFallback, reduceMotion, play, stop, onEnded, finishReveal]);

  // Lock scroll behind the overlay and restore the position on close.
  useEffect(() => {
    if (!open) return;
    const { scrollY } = window;
    const { body } = document;
    const previous = body.style.cssText;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.cssText = previous;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const close = useCallback(() => {
    stop();
    dismissResult();
    restoreFocusTo.current?.focus();
    // Unswapped items are kept; the outcome survives closing either way.
    if (result) {
      const outstanding = items.filter((entry) => entry.status === 'pending').map((e) => e.id);
      if (outstanding.length > 0) {
        void keepAction({ pullResultId: result.id, pulledItemIds: outstanding });
      }
    }
    setTimeout(reset, 250);
  }, [stop, dismissResult, result, items, reset]);

  const skip = useCallback(() => {
    stop();
    finishReveal();
  }, [stop, finishReveal]);

  // Lets the swap callback trigger a close without depending on it.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (phase === 'revealing') skip();
      else close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, phase, skip, close]);

  // Back gesture closes the overlay instead of leaving the page.
  useEffect(() => {
    if (!open) return;
    history.pushState({ revealOverlay: true }, '');
    const onPopState = () => close();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, close]);

  const runSwap = useCallback(
    async (ids: string[]) => {
      if (!result || ids.length === 0) return;
      setPending(true);
      const response = await swapAction({ pullResultId: result.id, pulledItemIds: ids });
      setPending(false);

      if (response.ok) {
        setCredited(response.data.credited);
        emitWalletBalance(response.data.walletBalance);
        const remaining = items.filter(
          (entry) => entry.status === 'pending' && !ids.includes(entry.id),
        );
        setItems((current) =>
          current.map((entry) =>
            ids.includes(entry.id) ? { ...entry, status: 'swapped' as const } : entry,
          ),
        );

        // Nothing left to act on — let the confirmation land, then close.
        if (remaining.length === 0) {
          setTimeout(() => closeRef.current(), 1400);
        }
      } else if (response.code === 'offer-expired') {
        setExpired(true);
      }
    },
    [result, items],
  );

  const keepAll = useCallback(async () => {
    if (!result) return;
    setPending(true);
    await keepAction({
      pullResultId: result.id,
      pulledItemIds: items.map((entry) => entry.id),
    });
    setPending(false);
    close();
  }, [result, items, close]);

  if (!result) return null;

  const single = items.length === 1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal
          aria-label="Your pull"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'fixed inset-0 z-[80] flex h-dvh flex-col items-center justify-center',
            // Transparent while the video plays: the video layer sits beneath
            // this one, so an opaque background here hides it completely.
            phase === 'revealing' ? 'bg-transparent' : 'bg-black/70 p-0 backdrop-blur-2xl sm:p-6',
          )}
        >
          {phase === 'revealing' ? (
            <button
              type="button"
              onClick={skip}
              className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-[90] rounded-full bg-surface-2/70 px-4 py-2 text-xs font-medium text-foreground-muted backdrop-blur hover:text-foreground"
            >
              Skip
            </button>
          ) : (
            <div className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none border border-border bg-surface-1 shadow-overlay sm:h-auto sm:rounded-3xl">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-20 grid size-11 place-items-center rounded-full bg-surface-2/70 text-foreground-muted backdrop-blur hover:text-foreground"
              >
                <X className="size-5" />
              </button>

              {credited ? (
                <p
                  role="status"
                  className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-20 -translate-x-1/2 rounded-full border border-value/40 bg-value/15 px-4 py-2 text-xs font-semibold backdrop-blur"
                >
                  <Price value={credited} tone="value" /> credited to your wallet
                </p>
              ) : null}

              {single ? (
                <div className="flex items-center justify-center p-4 pt-14 sm:p-8">
                  <SingleItemResult
                    pulled={items[0]!}
                    pending={pending}
                    expired={expired}
                    onSwap={() => void runSwap([items[0]!.id])}
                    onKeep={() => void keepAll()}
                  />
                </div>
              ) : (
                <MultiItemResult
                  items={items}
                  expiresAt={result.expiresAt}
                  pending={pending}
                  expired={expired}
                  onExpire={() => setExpired(true)}
                  onSwap={(ids) => void runSwap(ids)}
                />
              )}

              {expired ? (
                <p role="status" className="px-6 pb-4 text-center text-xs text-foreground-muted">
                  This offer has expired. All remaining items are yours to keep.
                </p>
              ) : null}
            </div>
          )}

          {phase === 'revealing' && (useFallback || reduceMotion) ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-sm text-foreground-muted">Opening your pull…</p>
            </div>
          ) : null}

          <div className="sr-only" aria-live="polite">
            {phase === 'result' ? `Revealed ${items.length} item${single ? '' : 's'}` : ''}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
