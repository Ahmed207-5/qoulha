'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CATEGORY_META } from '@/constants/message';
import type { MessageCategory } from '@/types/domain';

/**
 * Subscribes to new inserts on `messages` scoped to this recipient via RLS.
 * Note: RLS still applies to realtime — the client can only ever receive
 * rows matching the recipient's own `select` policy, so sender columns
 * never reach the browser even over the realtime channel.
 */
export function useRealtimeInbox(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const category = payload.new.category as MessageCategory;
          toast.success(`وصلتك رسالة ${CATEGORY_META[category]?.label ?? 'جديدة'} جديدة`);
          queryClient.invalidateQueries({ queryKey: ['inbox', userId] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
