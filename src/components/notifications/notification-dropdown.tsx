'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotificationsAction } from '@/services/notifications-service';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/actions/notifications';
import { NotificationItem } from './notification-item';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2, BellOff } from 'lucide-react';
import type { Notification } from '@/types/domain';

export function NotificationDropdown({
  onUnreadDelta,
  onClose,
}: {
  onUnreadDelta: (delta: number) => void;
  onClose: () => void;
}) {
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'initial'],
    queryFn: () => getNotificationsAction(),
  });

  React.useEffect(() => {
    if (data) {
      setItems(data.notifications);
      setCursor(data.nextCursor ?? undefined);
    }
  }, [data]);

  async function handleOpen(notification: Notification) {
    onClose();
    if (notification.is_read) return;
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    onUnreadDelta(-1);
    await markNotificationReadAction(notification.id);
  }

  async function handleMarkAllRead() {
    const unreadCount = items.filter((n) => !n.is_read).length;
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadDelta(-unreadCount);
    await markAllNotificationsReadAction();
    setMarkingAll(false);
  }

  async function handleLoadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const page = await getNotificationsAction(cursor);
    setItems((prev) => [...prev, ...page.notifications]);
    setCursor(page.nextCursor ?? undefined);
    setLoadingMore(false);
  }

  return (
    <div className="glass-strong absolute left-0 top-12 z-30 max-h-[28rem] w-80 overflow-hidden rounded-3xl sm:left-auto sm:right-0">
      <div className="flex items-center justify-between border-b border-brand-200/20 px-4 py-3 dark:border-white/10">
        <h3 className="font-display text-sm font-bold text-brand-950 dark:text-white">الإشعارات</h3>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} isLoading={markingAll}>
          <CheckCheck className="h-3.5 w-3.5" />
          قرأت الكل
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BellOff className="h-8 w-8 text-brand-300" />
            <p className="text-sm text-brand-500/70">مفيش إشعارات لسه</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-brand-200/10 dark:divide-white/5">
              {items.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onOpen={handleOpen} />
              ))}
            </div>
            {cursor && (
              <div className="flex justify-center py-3">
                <Button variant="ghost" size="sm" onClick={handleLoadMore} isLoading={loadingMore}>
                  حمّل أكتر
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
