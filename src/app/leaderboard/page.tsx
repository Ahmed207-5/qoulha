import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'المتصدرين', description: 'أكتر المستخدمين تفاعلاً على قولها' };

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-32">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">المتصدرين</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">أكتر المستخدمين تفاعلاً على قولها</p>
        </div>
        <LeaderboardView />
      </div>
    </>
  );
}
