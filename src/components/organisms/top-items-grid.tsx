import { ItemCard } from '@/components/molecules/item-card';
import type { Item } from '@/types/catalogue';

// Scrolls inside its own container so the section cannot grow the page unbounded.
export function TopItemsGrid({ items }: { items: Item[] }) {
  return (
    <section
      aria-labelledby="top-items-heading"
      className="flex h-full flex-col rounded-2xl border border-border bg-surface-1 p-4"
    >
      <h2 id="top-items-heading" className="mb-3 text-center text-base font-semibold">
        Top Items
      </h2>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-muted">
          No items are listed for this machine yet.
        </p>
      ) : (
        <ul
          tabIndex={0}
          aria-label="Top items list"
          className="grid scrollbar-slim max-h-[32rem] min-h-0 flex-1 auto-rows-max grid-cols-2 items-stretch gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-3"
        >
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 44vw"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
