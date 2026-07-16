import Link from 'next/link';
import { MessageCircleHeart } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function MobileTopbar({ userId, initialUnreadCount }: { userId: string; initialUnreadCount: number }) {
  return (
    <div className="glass-strong sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <MessageCircleHeart className="h-6 w-6 text-brand-500" />
        <span className="font-display text-base font-bold gradient-text">قولها</span>
      </Link>
      <NotificationBell userId={userId} initialUnreadCount={initialUnreadCount} />
    </div>
  );
}
