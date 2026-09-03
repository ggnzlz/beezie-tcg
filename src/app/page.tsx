import { redirect } from 'next/navigation';

import { getMachines } from '@/data/repository';

export default async function HomePage() {
  const machines = await getMachines();
  const featured = machines.find((machine) => machine.featured) ?? machines[0]!;
  redirect(`/claw/${featured.slug}`);
}
