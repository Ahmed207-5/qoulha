'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MessageCircleHeart, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar({ userId, initialUnreadCount = 0 }: { userId?: string; initialUnreadCount?: number }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong py-3' : 'bg-transparent py-5'
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <MessageCircleHeart className="h-7 w-7 text-brand-500" />
          <span className="font-display text-xl font-bold gradient-text">قولها</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            المميزات
          </a>
          <a href="#how" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            كيف تعمل
          </a>
          <a href="#privacy" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            الخصوصية
          </a>
          <Link href="/wall" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            الحائط العام
          </Link>
          <Link href="/search" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            البحث
          </Link>
          <Link href="/leaderboard" className="text-sm font-medium text-brand-700 hover:text-brand-500 dark:text-brand-200">
            المتصدرين
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {userId ? (
            <>
              <NotificationBell userId={userId} initialUnreadCount={initialUnreadCount} />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  لوحتي
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">تسجيل الدخول</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">اعمل حسابك</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
