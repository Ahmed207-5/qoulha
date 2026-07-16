'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getNotificationText } from '@/constants/notifications';
import type { NotificationType } from '@/types/domain';

/**
 * Subscribes to new inserts on `notifications` scoped to this user via RLS.
 * Tracks the unread count client-side so the navbar badge updates
 * instantly without a full refetch — the same "don't wait for revalidation"
 * approach used elsewhere for optimistic UI updates.
 */
export function useRealtimeNotifications(userId: string, initialUnreadCount: number) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const supabase = createClient();

    const topic = `notifications:${userId}`;

// If another component already created this realtime channel,
// don't subscribe again.
const existing = supabase
  .getChannels()
  .find((c) => c.topic === `realtime:${topic}`);

if (existing) {
  return;
}

const channel = supabase
  .channel(topic)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      const type = payload.new.type as NotificationType;
      setUnreadCount((count) => count + 1);
      toast.message(getNotificationText(type));
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
  }, [userId]);

  const decrementBy = useCallback((amount: number) => {
    setUnreadCount((count) => Math.max(0, count - amount));
  }, []);

  const resetToZero = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, decrementBy, resetToZero };
}
