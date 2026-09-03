'use client';

import { Menu, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: Route;
  /** Nav targets other than Claw are not part of this change. */
  enabled: boolean;
}

export function MobileNavMenu({ items, activeHref }: { items: NavItem[]; activeHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-lg text-foreground-muted hover:text-foreground"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-surface-1 shadow-raised"
        >
          <nav className="flex flex-col p-2">
            {items.map((item) =>
              item.enabled ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={item.href === activeHref ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-4 py-3 text-sm font-medium',
                    item.href === activeHref ? 'text-accent' : 'text-foreground-muted',
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  aria-disabled
                  className="px-4 py-3 text-sm font-medium text-foreground-subtle"
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
