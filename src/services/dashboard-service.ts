import { createClient } from '@/lib/supabase/server';
import type { DashboardStats, MessageCategory, MessageMood } from '@/types/domain';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();

  const [{ count: unread }, { count: totalRead }, { count: today }, { count: thisWeek }, { count: thisMonth }, { count: published }, { data: profileRow }, { data: categoryRows }, { data: moodRows }] =
    await Promise.all([
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_read', false).eq('is_deleted', false),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_read', true).eq('is_deleted', false),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_deleted', false).gte('created_at', startOfDay(now).toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_deleted', false).gte('created_at', startOfWeek(now).toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_deleted', false).gte('created_at', startOfMonth(now).toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_published', true),
      supabase.from('profiles').select('visitor_count').eq('id', userId).single(),
      supabase.from('messages').select('category').eq('recipient_id', userId).eq('is_deleted', false),
      supabase.from('messages').select('mood').eq('recipient_id', userId).eq('is_deleted', false),
    ]);

  const topCategory = mostFrequent((categoryRows ?? []).map((r) => r.category as MessageCategory));
  const topMood = mostFrequent((moodRows ?? []).map((r) => r.mood as MessageMood));

  return {
    unread: unread ?? 0,
    totalRead: totalRead ?? 0,
    today: today ?? 0,
    thisWeek: thisWeek ?? 0,
    thisMonth: thisMonth ?? 0,
    published: published ?? 0,
    visitors: profileRow?.visitor_count ?? 0,
    topCategory,
    topMood,
  };
}

function mostFrequent<T extends string>(items: T[]): T | null {
  if (items.length === 0) return null;
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

export async function getWeeklyMessageCounts(userId: string): Promise<{ day: string; count: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('messages')
    .select('created_at')
    .eq('recipient_id', userId)
    .eq('is_deleted', false)
    .gte('created_at', since.toISOString());

  const dayLabels = ['أحد', 'إتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'];
  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toDateString(), 0);
  }
  for (const row of data ?? []) {
    const key = new Date(row.created_at).toDateString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([dateStr, count]) => ({
    day: dayLabels[new Date(dateStr).getDay()] ?? '',
    count,
  }));
}
