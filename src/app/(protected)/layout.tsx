import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { MobileTopbar } from '@/components/dashboard/mobile-topbar';
import { RealtimeProvider } from '@/components/dashboard/realtime-provider';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { getDailySpaceUnreadStatus } from '@/services/daily-space-service';
import type { Metadata } from 'next';

// Applies to every page under this route group (dashboard, inbox, settings,
// analytics, suggested-users, today-space) — private, authenticated-only
// pages that should never be indexed. robots.txt already disallows these
// paths for well-behaved crawlers; this meta-robots tag is the more
// reliable signal against indexing if one is ever discovered via an
// external link.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) redirect('/onboarding');

  const [unreadCount, hasUnseenDailySpace] = await Promise.all([
    getUnreadNotificationCount(user.id),
    getDailySpaceUnreadStatus(user.id),
  ]);

  return (
    <RealtimeProvider userId={user.id}>
      <div className="min-h-screen lg:pr-64">
        <Sidebar
          isAdmin={profile.is_admin}
          userId={user.id}
          initialUnreadCount={unreadCount}
          hasUnseenDailySpace={hasUnseenDailySpace}
        />
        <MobileTopbar userId={user.id} initialUnreadCount={unreadCount} />
        <main className="mx-auto max-w-5xl px-6 pb-24 pt-8 lg:pb-8">{children}</main>
        <MobileNav hasUnseenDailySpace={hasUnseenDailySpace} />
      </div>
    </RealtimeProvider>
  );
}
