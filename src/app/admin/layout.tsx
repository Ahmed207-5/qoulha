import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { MobileTopbar } from '@/components/dashboard/mobile-topbar';
import { getUnreadNotificationCount } from '@/services/notifications-service';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  // Defense in depth: middleware already checks this, but never trust a
  // single layer for an admin-only surface.
  if (!profile?.is_admin) redirect('/dashboard');

  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <div className="min-h-screen lg:pr-64">
      <Sidebar isAdmin={true} userId={user.id} initialUnreadCount={unreadCount} />
      <MobileTopbar userId={user.id} initialUnreadCount={unreadCount} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 lg:pb-8">{children}</main>
      <MobileNav />
    </div>
  );
}
