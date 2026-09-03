'use client';

import { PointsBadge } from '@/components/atoms/points-badge';
import { Price } from '@/components/atoms/price';
import { PromoCodeField } from '@/components/molecules/promo-code-field';
import { QuantityStepper } from '@/components/molecules/quantity-stepper';
import { Button } from '@/components/ui/button';
import { useClawExperience } from '@/components/organisms/claw-experience-provider';

interface MachineSummaryPanelProps {
  onFirstInteraction?: () => void;
}

export function MachineSummaryPanel({ onFirstInteraction }: MachineSummaryPanelProps) {
  const { machine, quantity, setQuantity, quote, appliedPromo, applyPromo, openReview } =
    useClawExperience();

  const restocking = machine.inventoryRemaining === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold sm:text-2xl">{machine.name}</h1>
        <p className="text-sm text-foreground-muted">{machine.description}</p>
      </div>

      <div className="flex items-baseline gap-2.5">
        <Price value={quote.total} className="text-2xl font-semibold sm:text-3xl" />
        <PointsBadge points={quote.pointsAwarded} />
        {quote.discount.amount > 0 ? (
          <span className="text-sm text-foreground-subtle line-through">
            <Price value={quote.subtotal} tone="muted" />
          </span>
        ) : null}
      </div>

      <div className="flex gap-3">
        <QuantityStepper
          value={quantity}
          max={machine.maxQuantity}
          onChange={setQuantity}
          onInteract={onFirstInteraction}
          className="w-32 shrink-0"
        />

        <Button
          type="button"
          onClick={() => {
            onFirstInteraction?.();
            openReview();
          }}
          disabled={restocking}
          aria-describedby={restocking ? 'restocking-reason' : undefined}
          className="h-12 flex-1 text-base font-semibold"
        >
          {restocking ? 'Restocking soon' : 'Start Now'}
        </Button>
      </div>

      {restocking ? (
        <p id="restocking-reason" role="status" className="text-xs text-foreground-muted">
          This machine is out of inventory and is being restocked. Try another machine below.
        </p>
      ) : null}

      <PromoCodeField applied={appliedPromo} onApply={applyPromo} />
    </div>
  );
}
