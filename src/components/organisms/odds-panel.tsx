import { HelpCircle } from 'lucide-react';

import { Price } from '@/components/atoms/price';
import { OddsTier } from '@/components/molecules/odds-tier';
import { RARITY_ORDER, type Machine } from '@/types/catalogue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function OddsPanel({ machine }: { machine: Machine }) {
  const tiers = [...machine.odds].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
  );
  const topTier = tiers[0];

  return (
    <section aria-labelledby="odds-heading" className="space-y-2.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 id="odds-heading" className="text-base font-semibold">
              Odds
            </h2>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger
                  aria-label="How odds are calculated"
                  className="-m-2.5 grid size-11 place-items-center rounded-full text-foreground-subtle hover:text-foreground-muted"
                >
                  <HelpCircle className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">
                  Odds are the live probability of pulling from each value band. They shift as
                  inventory is pulled and restocked, and are recalculated every few seconds.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-foreground-subtle">Updates every few seconds.</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-foreground-muted">Average Value:</p>
          <Price value={machine.averageValue} tone="value" className="text-lg font-semibold" />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {tiers.map((tier) => (
          <OddsTier key={tier.rarity} tier={tier} isTopTier={tier === topTier} />
        ))}
      </ul>
    </section>
  );
}
