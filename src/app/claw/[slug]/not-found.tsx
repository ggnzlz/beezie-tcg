import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function ClawNotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">404</p>
        <h1 className="text-2xl font-semibold">That claw machine isn&apos;t here</h1>
        <p className="text-sm text-foreground-muted">
          It may have been retired or restocked under a different name.
        </p>
        <Button asChild>
          <Link href="/">Back to the claw floor</Link>
        </Button>
      </div>
    </div>
  );
}
