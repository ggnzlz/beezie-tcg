'use client';

import dynamic from 'next/dynamic';
import { Suspense, useCallback, useRef, useState } from 'react';

import { MachineSummaryPanel } from '@/components/organisms/machine-summary-panel';
import { OddsPanel } from '@/components/organisms/odds-panel';
import { MachineSwitcher } from '@/components/organisms/machine-switcher';
import { RevealMediaProvider } from '@/components/organisms/reveal-media-provider';
import { ClawExperienceProvider } from '@/components/organisms/claw-experience-provider';
import type { Machine, PaymentMethod } from '@/types/catalogue';

// Deferred so Radix and Motion stay out of the initial bundle.
const PaymentReviewSurface = dynamic(() =>
  import('@/components/organisms/payment-review-surface').then((m) => m.PaymentReviewSurface),
);

const RevealOverlay = dynamic(() =>
  import('@/components/organisms/reveal-overlay').then((m) => m.RevealOverlay),
);

interface ClawDetailsPanelProps {
  machine: Machine;
  machines: Machine[];
  paymentMethods: PaymentMethod[];
  seed?: number;
}

// The only interactive region on the page; everything else stays server-rendered.
export function ClawDetailsPanel({
  machine,
  machines,
  paymentMethods,
  seed,
}: ClawDetailsPanelProps) {
  const primed = useRef(false);
  const [engaged, setEngaged] = useState(false);

  // Fetch the overlay chunks on intent rather than on commit.
  const warm = useCallback(() => setEngaged(true), []);

  const onFirstInteraction = useCallback(() => {
    setEngaged(true);
    if (primed.current) return;
    primed.current = true;
    window.dispatchEvent(new CustomEvent('beezie:prime-reveal'));
  }, []);

  return (
    <RevealMediaProvider>
      <ClawExperienceProvider machine={machine} paymentMethods={paymentMethods} seed={seed}>
        <div
          onPointerEnter={warm}
          onFocusCapture={warm}
          onTouchStart={warm}
          className="space-y-5 rounded-2xl border border-border bg-surface-1 p-4 sm:p-5"
        >
          <MachineSummaryPanel onFirstInteraction={onFirstInteraction} />
          <hr className="border-border" />
          <OddsPanel machine={machine} />
          <hr className="border-border" />
          <MachineSwitcher machines={machines} currentSlug={machine.slug} />
        </div>

        {engaged ? (
          // Own boundary: otherwise the suspending import bubbles to the page
          // boundary and remounts this panel, wiping quantity and promo.
          <Suspense fallback={null}>
            <PaymentReviewSurface />
            <RevealOverlay />
          </Suspense>
        ) : null}
      </ClawExperienceProvider>
    </RevealMediaProvider>
  );
}
