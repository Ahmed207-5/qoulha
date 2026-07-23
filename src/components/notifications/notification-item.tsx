import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { NOTIFICATION_META, getNotificationText } from '@/constants/notifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/domain';

function getNotificationHref(notification: Notification): string {
  switch (notification.type) {
    case 'new_message':
      return '/inbox';
    case 'new_reply':
    case 'new_comment':
    case 'mention':
    case 'reaction':
    case 'new_repost':
      return notification.payload.message_id ? `/m/${notification.payload.message_id}` : '/wall';
    case 'new_follower':
      return notification.actor ? `/u/${notification.actor.username}` : '/dashboard';
    case 'moderation':
    case 'system':
    default:
      return '/inbox';
  }
}

export function NotificationItem({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  const meta = NOTIFICATION_META[notification.type];
  const Icon = meta.icon;

  return (
    <Link
      href={getNotificationHref(notification)}
      onClick={() => onOpen(notification)}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-500/5',
        !notification.is_read && 'bg-brand-500/[0.04]'
      )}
    >
      {notification.actor?.avatar_url ? (
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-500/10">
          <Image src={notification.actor.avatar_url} alt="" width={36} height={36} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${meta.color}20` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: meta.color }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-brand-900 dark:text-brand-50">
          {getNotificationText(notification.type, notification.actor?.full_name)}
        </p>
        <p className="mt-0.5 text-[11px] text-brand-500/60">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>

      {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
    </Link>
  );
}
