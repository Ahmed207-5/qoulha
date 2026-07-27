import { WallGrid } from '@/components/wall/wall-grid';
import { TrendingTagsBar } from '@/components/wall/trending-tags-bar';
import { ConfessionOfTheDay } from '@/components/wall/confession-of-the-day';
import { RandomMessageButton } from '@/components/wall/random-message-button';
import { SuggestedUsersCarousel } from '@/components/wall/suggested-users-carousel';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { getSuggestedUsers } from '@/services/suggested-users-service';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الحائط العام',
  description: 'رسائل حقيقية اختار أصحابها ينشروها على قولها',
  alternates: { canonical: '/wall' },
};

export default async function WallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  const suggestedUsers = user ? await getSuggestedUsers([], 10) : [];

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">الحائط العام</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">رسائل حقيقية اختار أصحابها ينشروها</p>
          <div className="mt-4 flex justify-center">
            <RandomMessageButton />
          </div>
        </div>
        <ConfessionOfTheDay viewerId={user?.id} />
        {user && suggestedUsers.length > 0 && <SuggestedUsersCarousel initialUsers={suggestedUsers} />}
        <TrendingTagsBar />
        <WallGrid viewerId={user?.id} />
      </div>
    </>
  );
}
