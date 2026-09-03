import { NextResponse } from 'next/server';

import { getRecentPulls } from '@/data/repository';

/** In-app mock endpoint. The feed poller is the one genuinely client-side read. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const machineId = new URL(request.url).searchParams.get('machineId');
  if (!machineId) {
    return NextResponse.json({ error: 'machineId is required' }, { status: 400 });
  }

  const pulls = await getRecentPulls(machineId, 12);
  return NextResponse.json({ pulls }, { headers: { 'Cache-Control': 'no-store' } });
}
