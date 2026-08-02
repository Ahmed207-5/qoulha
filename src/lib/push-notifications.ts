import { adminMessaging } from '@/lib/firebase-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getNotificationText } from '@/constants/notifications';
import type { NotificationPayload, NotificationType } from '@/types/domain';

/**
 * Shape of a row from `public.notifications`. Every notification-creating
 * path in the schema (new message, reply, comment, reaction, repost,
 * follow, mention, daily space, admin broadcast, moderation — see
 * 0016/0021/0022/0025/0026/0027/0028/0029) ends by inserting a row here,
 * whether directly or through create_notification().
 *
 * There is no Database Webhook involved (not every Supabase project has
 * `supabase_functions.http_request`/pg_net available) — instead, each
 * server action that performs one of those inserts calls this function
 * directly right afterwards, via the small lookup helper in
 * src/lib/push-dispatch.ts. This function itself doesn't know or care
 * where its caller found the row.
 */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: NotificationPayload;
}

/** FCM registration-token error codes that mean the token is dead and should be deleted, not retried. */
const DEAD_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Same routing rule as getNotificationHref() in
 * src/components/notifications/notification-item.tsx, kept as its own
 * small copy here rather than imported: that file is a client component
 * ('next/link', click handlers) and isn't meant to be pulled into a
 * server/webhook code path. Any change to one should be mirrored in the
 * other.
 */
function getNotificationPath(type: NotificationType, payload: NotificationPayload, actorUsername?: string): string {
  switch (type) {
    case 'new_message':
      return payload.message_id ? `/m/${payload.message_id}` : '/inbox';
    case 'new_reply':
    case 'new_comment':
    case 'mention':
    case 'reaction':
    case 'new_repost':
      return payload.message_id ? `/m/${payload.message_id}` : '/wall';
    case 'daily_space_mention':
    case 'daily_space_published':
      return '/today-space';
    case 'admin_broadcast':
      if (payload.message_id) return `/m/${payload.message_id}`;
      if (payload.daily_post_id) return '/today-space';
      return '/wall';
    case 'new_follower':
      return actorUsername ? `/u/${actorUsername}` : '/dashboard';
    case 'moderation':
    case 'system':
    default:
      return '/inbox';
  }
}

/**
 * Sends a push notification (web push via FCM) for a freshly-created
 * notifications row, to every device the target user has registered in
 * `user_push_tokens`. Never throws — a push delivery failure must never
 * break the underlying action (sending a message, following someone,
 * etc.), so every failure path here is caught and logged instead.
 */
export async function sendPushForNotification(row: NotificationRow): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    const { data: tokenRows, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', row.user_id);

    if (tokensError) {
      console.error('[push] failed to load push tokens:', tokensError);
      return;
    }

    const tokens = (tokenRows ?? []).map((t: { token: string }) => t.token).filter(Boolean);
    if (tokens.length === 0) return; // user has no registered devices — not an error

    let actorName: string | undefined;
    let actorUsername: string | undefined;
    if (row.payload?.actor_id) {
      const { data: actor } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', row.payload.actor_id)
        .single();
      actorName = actor?.full_name ?? undefined;
      actorUsername = actor?.username ?? undefined;
    }

    const body = getNotificationText(row.type, actorName);
    const path = getNotificationPath(row.type, row.payload, actorUsername);

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: 'قولها',
        body,
      },
      data: {
        url: path,
      },
      webpush: {
        fcmOptions: {
          link: path,
        },
      },
    });

console.log("[push] success:", response.successCount);
console.log("[push] failure:", response.failureCount);

response.responses.forEach((r, i) => {
  console.log("[push] token", i, {
    success: r.success,
    code: r.error?.code,
    message: r.error?.message,
  });
});

    if (response.failureCount > 0) {
      const deadTokens: string[] = [];

      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = result.error?.code;
        const token = tokens[index];
        if (code && DEAD_TOKEN_ERROR_CODES.has(code) && token) {
          deadTokens.push(token);
        } else {
          console.error('[push] send failed for a token:', code, result.error?.message);
        }
      });

      if (deadTokens.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_push_tokens')
          .delete()
          .in('token', deadTokens);
        if (deleteError) {
          console.error('[push] failed to remove invalid tokens:', deleteError);
        }
      }
    }
  } catch (error) {
    console.error('[push] unexpected error sending push notification:', error);
  }
}
