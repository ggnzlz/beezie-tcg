import Image from 'next/image';
import Link from 'next/link';

import { BeezieLogo } from '@/components/atoms/beezie-logo';
import { MobileNavMenu, type NavItem } from '@/components/molecules/mobile-nav-menu';
import { WalletBalance } from '@/components/molecules/wallet-balance';
import type { Money } from '@/lib/money';
import { cn } from '@/lib/utils';

const NAV: NavItem[] = [
  { label: 'Marketplace', href: '/marketplace' as NavItem['href'], enabled: false },
  { label: 'Claw', href: '/', enabled: true },
  { label: 'Leaderboard', href: '/leaderboard' as NavItem['href'], enabled: false },
  { label: 'Resources', href: '/resources' as NavItem['href'], enabled: false },
  { label: 'More', href: '/more' as NavItem['href'], enabled: false },
];

interface AppHeaderProps {
  balance: Money;
  activeHref?: string;
}

export function AppHeader({ balance, activeHref = '/' }: AppHeaderProps) {
  return (
    <header className="relative z-40 bg-surface-0/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-350 items-center gap-3 px-3 sm:gap-6 sm:px-6 lg:gap-8">
        <Link href="/" aria-label="Beezie home" className="flex min-h-11 shrink-0 items-center">
          <BeezieLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) =>
            item.enabled ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.href === activeHref ? 'page' : undefined}
                className={cn(
                  'text-sm font-medium transition-colors',
                  item.href === activeHref
                    ? 'text-foreground'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled
                title="Not part of this prototype"
                className="cursor-default text-sm font-medium text-foreground-muted/70"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <WalletBalance initial={balance} />

          <Image
            src="/media/machine-solana.webp"
            alt="Your profile"
            width={36}
            height={36}
            className="hidden size-9 shrink-0 rounded-full border border-border object-cover sm:block"
          />

          <MobileNavMenu items={NAV} activeHref={activeHref} />
        </div>
      </div>
    </header>
  );
}
