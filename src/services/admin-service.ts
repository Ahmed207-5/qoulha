import { createClient } from '@/lib/supabase/server';

export interface PlatformStats {
  totalUsers: number;
  totalMessages: number;
  totalPublished: number;
  pendingReports: number;
  newUsersToday: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: totalUsers }, { count: totalMessages }, { count: totalPublished }, { count: pendingReports }, { count: newUsersToday }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalMessages: totalMessages ?? 0,
    totalPublished: totalPublished ?? 0,
    pendingReports: pendingReports ?? 0,
    newUsersToday: newUsersToday ?? 0,
  };
}

export async function getUsersList(page: number, pageSize: number, search?: string) {
  const supabase = await createClient();
  let q = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, message_count, is_suspended, is_admin, created_at', { count: 'exact' });

  if (search) q = q.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);

  const from = page * pageSize;
  const { data, count } = await q.order('created_at', { ascending: false }).range(from, from + pageSize - 1);
  return { users: data ?? [], totalCount: count ?? 0 };
}

export async function getReportsList(status: 'pending' | 'reviewed' | 'actioned' | 'dismissed' | 'all') {
  const supabase = await createClient();
  let q = supabase
    .from('reports')
    .select('id, reason, details, status, created_at, message:messages(id, content, category), reporter:profiles!reports_reporter_id_fkey(username)');

  if (status !== 'all') q = q.eq('status', status);

  const { data } = await q.order('created_at', { ascending: false }).limit(50);
  return data ?? [];
}

export async function getActivityLogs(page: number, pageSize: number) {
  const supabase = await createClient();
  const from = page * pageSize;
  const { data, count } = await supabase
    .from('activity_logs')
    .select('id, action, metadata, created_at, user:profiles(username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  return { logs: data ?? [], totalCount: count ?? 0 };
}
