'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { markDailySpaceViewedAction } from '@/actions/daily-space';

/**
 * Fires once when the Today's Space page mounts: upserts the viewer's
 * single daily_post_views row (see 0027_daily_space_engagement.sql), then
 * refreshes the route so the sidebar (a parent Server Component prop) picks
 * up the now-cleared unread status on this same visit — not just the next
 * navigation. Renders nothing.
 */
export function DailySpaceViewMarker({ dailyPostId }: { dailyPostId: string | null }) {
  const router = useRouter();
  const marked = React.useRef(false);

  React.useEffect(() => {
    if (!dailyPostId || marked.current) return;
    marked.current = true;
    markDailySpaceViewedAction(dailyPostId).then((result) => {
      if (result.success) router.refresh();
    });
  }, [dailyPostId, router]);

  return null;
}
