'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell({ userId, initialUnreadCount }: { userId: string; initialUnreadCount: number }) {
  const [open, setOpen] = React.useState(false);
  const { unreadCount, decrementBy } = useRealtimeNotifications(userId, initialUnreadCount);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-700 hover:bg-brand-500/10 dark:text-brand-200"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <NotificationDropdown onUnreadDelta={decrementBy} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}
