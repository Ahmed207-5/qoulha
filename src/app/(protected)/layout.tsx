import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { MobileTopbar } from '@/components/dashboard/mobile-topbar';
import { RealtimeProvider } from '@/components/dashboard/realtime-provider';
import { getUnreadNotificationCount } from '@/services/notifications-service';

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

  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <RealtimeProvider userId={user.id}>
      <div className="min-h-screen lg:pr-64">
        <Sidebar isAdmin={profile.is_admin} userId={user.id} initialUnreadCount={unreadCount} />
        <MobileTopbar userId={user.id} initialUnreadCount={unreadCount} />
        <main className="mx-auto max-w-5xl px-6 pb-24 pt-8 lg:pb-8">{children}</main>
        <MobileNav />
      </div>
    </RealtimeProvider>
  );
}
