import { SearchView } from '@/components/search/search-view';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'البحث', description: 'دور على رسائل ومستخدمين على قولها' };

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-32">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">البحث</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">دور على رسائل ومستخدمين</p>
        </div>
        <SearchView viewerId={user?.id} />
      </div>
    </>
  );
}
