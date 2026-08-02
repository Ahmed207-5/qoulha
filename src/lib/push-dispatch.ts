import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendPushForNotification, type NotificationRow } from '@/lib/push-notifications';
import type { NotificationType } from '@/types/domain';

/**
 * Replaces the Database Webhook flow (removed — supabase_functions.http_request
 * and Database Webhooks aren't available on every Supabase project).
 *
 * The "who gets notified and with what payload" logic is untouched and
 * still lives entirely in SQL — every existing trigger/RPC
 * (create_notification() and friends in 0016/0021/0022/0025/0026/0027/
 * 0028/0029) keeps creating notifications rows exactly as it always has.
 * This function just finds the row(s) a trigger/RPC created during the
 * current request and forwards each to sendPushForNotification(), which
 * is itself completely unchanged.
 *
 * Call this from a server action immediately after the write that causes
 * (via a trigger) or performs (via a direct/bulk insert) a notification
 * insert — e.g. right after inserting a comment, following someone, or
 * calling the admin_create_daily_post RPC.
 *
 * `since` (an ISO timestamp captured just before the write) combined with
 * a narrowing filter is what keeps this precise: a payload/user filter
 * alone can match an older, already-pushed notification of the same kind
 * (e.g. two different replies to the same message both produce a
 * `new_reply` row keyed by that message_id) — `since` scopes the lookup
 * to rows this specific request just caused.
 */
export async function dispatchPushForNewNotifications(params: {
  /** ISO timestamp captured right before the mutating write. */
  since: string;
  /** Notification type(s) the write can produce. */
  types: NotificationType[];
  /** Exact `user_id` (the notifications table's real recipient column), when known up front — e.g. a follow's target user. */
  userId?: string;
  /** Subset of the jsonb `payload` column the new row(s) must contain, e.g. `{ comment_id: newComment.id }`. */
  payloadContains?: Record<string, string>;
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    let query = supabase
      .from('notifications')
      .select('id, user_id, type, payload')
      .in('type', params.types)
      .gte('created_at', params.since);

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params.payloadContains) {
      query = query.contains('payload', params.payloadContains);
    }

    const { data, error } = await query;

console.log("[push] lookup result:", data);

if (error) {
  console.error("[push] lookup error:", error);
  return;
}

if (!data || data.length === 0) {
  console.log("[push] no notifications found");
  return;
}

console.log("[push] sending", data.length, "notifications");

await Promise.all(
  (data as NotificationRow[]).map((row) => sendPushForNotification(row))
);
  } catch (error) {
    console.error('[push] unexpected error dispatching push for new notifications:', error);
  }
}
