import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AppHeader } from '@/components/organisms/app-header';
import { getPaymentMethods } from '@/data/repository';
import { usd } from '@/lib/money';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Beezie',
    template: '%s · Beezie',
  },
  description: 'Pull, reveal and swap graded collectibles.',
};

export const viewport: Viewport = {
  themeColor: '#101013',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const methods = await getPaymentMethods();
  const balance = methods.find((method) => method.kind === 'beezie-wallet')?.balance ?? usd(0);

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh">
        <AppHeader balance={balance} />
        <main>{children}</main>
      </body>
    </html>
  );
}
