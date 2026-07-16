import { TrendingView } from '@/components/trending/trending-view';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الترند', description: 'أكتر الرسائل والتاجات والكتّاب ترند على قولها' };

export default async function TrendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">الترند</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">إيه اللي بيحصل دلوقتي على قولها</p>
        </div>
        <TrendingView viewerId={user?.id} />
      </div>
    </>
  );
}
