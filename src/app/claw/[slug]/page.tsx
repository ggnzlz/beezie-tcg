import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ClawDetailsPanel } from '@/components/organisms/claw-details-panel';
import { ClawHero } from '@/components/organisms/claw-hero';
import { RecentPullsSection, TopItemsSection } from '@/components/organisms/claw-page-sections';
import {
  RecentPullsFeedSkeleton,
  TopItemsGridSkeleton,
} from '@/components/organisms/section-skeletons';
import { ClawPageTemplate } from '@/components/templates/claw-page-template';
import { getMachineBySlug, getMachines, getPaymentMethods } from '@/data/repository';
import { format } from '@/lib/money';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ seed?: string }>;
}

export async function generateStaticParams() {
  const machines = await getMachines();
  return machines.map((machine) => ({ slug: machine.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const machine = await getMachineBySlug(slug);
  if (!machine) return { title: 'Machine not found' };

  const title = machine.name;
  const description = `${machine.description} ${format(machine.unitPrice)} per pull, average value ${format(machine.averageValue)}.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: machine.media.thumbnail }] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ClawMachinePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const machine = await getMachineBySlug(slug);
  if (!machine) notFound();

  const { seed } = await searchParams;
  const parsedSeed = seed !== undefined && /^-?\d+$/.test(seed) ? Number(seed) : undefined;

  const [machines, paymentMethods] = await Promise.all([getMachines(), getPaymentMethods()]);

  return (
    <ClawPageTemplate
      hero={<ClawHero machine={machine} />}
      details={
        <ClawDetailsPanel
          machine={machine}
          machines={machines}
          paymentMethods={paymentMethods}
          seed={parsedSeed}
        />
      }
      topItems={
        <Suspense fallback={<TopItemsGridSkeleton />}>
          <TopItemsSection machineId={machine.id} />
        </Suspense>
      }
      recentPulls={
        <Suspense fallback={<RecentPullsFeedSkeleton />}>
          <RecentPullsSection machineId={machine.id} />
        </Suspense>
      }
    />
  );
}
