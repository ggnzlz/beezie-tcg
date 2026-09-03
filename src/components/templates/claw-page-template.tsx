import type { ReactNode } from 'react';

interface ClawPageTemplateProps {
  hero: ReactNode;
  details: ReactNode;
  topItems: ReactNode;
  recentPulls: ReactNode;
}

// Two columns from xl only: the right column is a fixed 600px, so splitting at
// lg left the hero too narrow. Below xl everything stacks and `order` drives the
// sequence, keeping one DOM for both layouts.
export function ClawPageTemplate({ hero, details, topItems, recentPulls }: ClawPageTemplateProps) {
  return (
    <div className="mx-auto w-full max-w-350 px-4 pt-2 pb-16 sm:px-6 sm:pt-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)] xl:gap-6">
        <div className="order-1 xl:col-start-1 xl:row-start-1">{hero}</div>
        <div className="order-2 xl:col-start-2 xl:row-start-1">{details}</div>
        <div className="order-3 xl:col-start-1 xl:row-start-2">{topItems}</div>
        <div className="order-4 xl:col-start-2 xl:row-start-2">{recentPulls}</div>
      </div>
    </div>
  );
}
