'use client';

import Image from 'next/image';
import { AlertCircle, Loader2 } from 'lucide-react';

import { PointsBadge } from '@/components/atoms/points-badge';
import { Price } from '@/components/atoms/price';
import { PaymentMethodOption } from '@/components/molecules/payment-method-option';
import { useClawExperience } from '@/components/organisms/claw-experience-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { RadioGroup } from '@/components/ui/radio-group';
import { useIsMobile } from '@/hooks/use-is-mobile';

function OrderSummary() {
  const { machine, quote, quantity, appliedPromo } = useClawExperience();

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-3">
        <Image
          src={machine.media.thumbnail}
          alt=""
          width={56}
          height={56}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{machine.name}</p>
          <p className="text-xs text-foreground-muted">
            <Price value={machine.unitPrice} tone="muted" /> per pull
          </p>
        </div>
        <PointsBadge points={quote.pointsAwarded} className="shrink-0" />
      </div>

      <dl className="mt-auto space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground-muted">Quantity</dt>
          <dd className="font-medium tabular-nums">{quantity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-muted">Subtotal</dt>
          <dd className="font-medium">
            <Price value={quote.subtotal} />
          </dd>
        </div>
        {quote.discount.amount > 0 ? (
          <div className="flex justify-between">
            <dt className="text-foreground-muted">
              Discount{appliedPromo ? ` (${appliedPromo.code})` : ''}
            </dt>
            <dd className="font-medium text-value">
              −<Price value={quote.discount} tone="value" />
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">
            <Price value={quote.total} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function PayWith() {
  const { paymentMethods, paymentMethodId, selectMethod, quote } = useClawExperience();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-foreground-muted uppercase">
        Pay with
      </h3>
      <RadioGroup
        value={paymentMethodId ?? undefined}
        onValueChange={selectMethod}
        className="gap-2"
      >
        {paymentMethods.map((method) => (
          <PaymentMethodOption
            key={method.id}
            method={method}
            total={quote.total}
            selected={method.id === paymentMethodId}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

function ConfirmBar() {
  const { quote, paymentMethods, paymentMethodId, confirm, phase, error } = useClawExperience();

  const selected = paymentMethods.find((method) => method.id === paymentMethodId);
  const insufficient = Boolean(selected?.balance && selected.balance.amount < quote.total.amount);
  const pending = phase === 'purchasing';

  return (
    <div className="space-y-3">
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger"
        >
          <AlertCircle aria-hidden className="mt-px size-4 shrink-0" />
          <span>{error.message}</span>
        </p>
      ) : null}

      <Button
        type="button"
        onClick={confirm}
        disabled={pending || insufficient || !paymentMethodId}
        className="h-12 w-full text-base font-semibold"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Confirming…
          </>
        ) : error ? (
          'Try again'
        ) : (
          <>
            Confirm · <Price value={quote.total} tone="accent" className="text-inherit" />
          </>
        )}
      </Button>
    </div>
  );
}

export function PaymentReviewSurface() {
  const { phase, closeReview } = useClawExperience();
  const isMobile = useIsMobile();

  // `purchasing` keeps the surface open so the pending state is visible.
  const open = phase === 'reviewing' || phase === 'purchasing';
  const onOpenChange = (next: boolean) => {
    if (!next && phase === 'reviewing') closeReview();
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle>Review &amp; pay</DrawerTitle>
          </DrawerHeader>
          <div className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2">
            <OrderSummary />
            <PayWith />
          </div>
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ConfirmBar />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Review &amp; pay</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a payment method and confirm your pull.
          </DialogDescription>
        </DialogHeader>

        {/* Two columns on desktop, matching the Figma: methods left, summary right. */}
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-6">
          <div className="grid grid-cols-2 items-stretch gap-5">
            <PayWith />
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-foreground-muted uppercase">
                Summary
              </h3>
              <div className="min-h-0 flex-1">
                <OrderSummary />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-6">
          <ConfirmBar />
        </div>
      </DialogContent>
    </Dialog>
  );
}
