'use client';

import { useRealtimeInbox } from '@/hooks/use-realtime-inbox';

export function RealtimeProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  useRealtimeInbox(userId);
  return <>{children}</>;
}
