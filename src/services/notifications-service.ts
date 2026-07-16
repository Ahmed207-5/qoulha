'use server';

import { createClient } from '@/lib/supabase/server';
import type { Notification, NotificationPayload, Profile } from '@/types/domain';

interface NotificationRow {
  id: string;
  user_id: string;
  type: Notification['type'];
  payload: NotificationPayload;
  is_read: boolean;
  created_at: string;
}

type ActorProfile = Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;

/**
 * Notifications don't have a direct FK-based join to the acting profile
 * (the actor id lives inside the jsonb payload, since different
 * notification types carry different payload shapes) — so actor profiles
 * are fetched in a single batched follow-up query instead, the same
 * pattern used for comments/reposts counts in wall-service.ts.
 */
export async function getNotificationsAction(cursor?: string, pageSize = 20): Promise<{
  notifications: Notification[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], nextCursor: null };

  let q = supabase
    .from('notifications')
    .select('id, user_id, type, payload, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (cursor) q = q.lt('created_at', cursor);

  const { data, error } = await q;
  if (error || !data) return { notifications: [], nextCursor: null };

  const rows = data as unknown as NotificationRow[];
  const actorIds = [...new Set(rows.map((r) => r.payload?.actor_id).filter((id): id is string => !!id))];

  const actorMap = new Map<string, ActorProfile>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', actorIds);
    for (const actor of actors ?? []) {
      actorMap.set(actor.id, { username: actor.username, full_name: actor.full_name, avatar_url: actor.avatar_url });
    }
  }

  const notifications: Notification[] = rows.map((row) => ({
    ...row,
    actor: row.payload?.actor_id ? (actorMap.get(row.payload.actor_id) ?? null) : null,
  }));

  const last = notifications[notifications.length - 1];
  const nextCursor = notifications.length === pageSize && last ? last.created_at : null;
  return { notifications, nextCursor };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count ?? 0;
}
