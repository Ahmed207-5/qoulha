'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, Settings, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/inbox', label: 'الرسائل', icon: Inbox },
  { href: '/suggested-users', label: 'قد تعرفهم', icon: Users },
  { href: '/today-space', label: 'مساحة اليوم', icon: Sparkles },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function MobileNav({ hasUnseenDailySpace = false }: { hasUnseenDailySpace?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex items-center justify-around py-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium',
              active ? 'text-brand-500' : 'text-brand-700/60 dark:text-brand-200/60'
            )}
          >
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {item.href === '/today-space' && hasUnseenDailySpace && (
                <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500" aria-label="محتوى جديد" />
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
