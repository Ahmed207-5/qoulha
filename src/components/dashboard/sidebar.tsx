'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, Settings, MessageCircleHeart, LogOut, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/actions/auth';
import { NotificationBell } from '@/components/notifications/notification-bell';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/inbox', label: 'الرسائل', icon: Inbox },
  { href: '/analytics', label: 'الإحصائيات', icon: BarChart3 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({
  isAdmin,
  userId,
  initialUnreadCount,
}: {
  isAdmin: boolean;
  userId: string;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-brand-200/30 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-brand-950/50 lg:flex">
      <div className="flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <MessageCircleHeart className="h-7 w-7 text-brand-500" />
          <span className="font-display text-lg font-bold gradient-text">قولها</span>
        </Link>
        <NotificationBell userId={userId} initialUnreadCount={initialUnreadCount} />
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'text-brand-700/70 hover:bg-brand-500/5 dark:text-brand-200/70'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'text-brand-700/70 hover:bg-brand-500/5 dark:text-brand-200/70'
            )}
          >
            <Shield className="h-4.5 w-4.5" />
            لوحة الإدارة
          </Link>
        )}
      </nav>

      <form action={signOutAction} className="px-4 pb-6">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/5">
          <LogOut className="h-4.5 w-4.5" />
          تسجيل الخروج
        </button>
      </form>
    </aside>
  );
}
