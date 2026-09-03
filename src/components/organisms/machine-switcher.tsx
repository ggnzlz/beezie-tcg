import { MachineSwitcherTile } from '@/components/molecules/machine-switcher-tile';
import type { Machine } from '@/types/catalogue';

interface MachineSwitcherProps {
  machines: Machine[];
  currentSlug: string;
}

export function MachineSwitcher({ machines, currentSlug }: MachineSwitcherProps) {
  const others = machines.filter((machine) => machine.slug !== currentSlug);
  if (others.length === 0) return null;

  return (
    <section aria-labelledby="more-machines-heading" className="space-y-2.5">
      <h2 id="more-machines-heading" className="text-base font-semibold">
        More Claw Machines
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {others.map((machine) => (
          <li key={machine.id}>
            <MachineSwitcherTile machine={machine} isCurrent={machine.slug === currentSlug} />
          </li>
        ))}
      </ul>
    </section>
  );
}
