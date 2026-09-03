import { RecentPullsFeed } from '@/components/organisms/recent-pulls-feed';
import { TopItemsGrid } from '@/components/organisms/top-items-grid';
import { getRecentPulls, getTopItems } from '@/data/repository';

// Each section owns its own read so Suspense can stream it independently.

export async function TopItemsSection({ machineId }: { machineId: string }) {
  const items = await getTopItems(machineId);
  return <TopItemsGrid items={items} />;
}

export async function RecentPullsSection({ machineId }: { machineId: string }) {
  const pulls = await getRecentPulls(machineId);
  return <RecentPullsFeed machineId={machineId} initialPulls={pulls} />;
}
