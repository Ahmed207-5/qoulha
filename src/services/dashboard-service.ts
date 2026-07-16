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

export interface MostSuccessfulMessage {
  id: string;
  content: string;
  category: MessageCategory;
  engagementScore: number;
}

/** Highest-engagement (reactions + comments×2 + reposts×3) message this user has received. */
export async function getMostSuccessfulMessage(userId: string): Promise<MostSuccessfulMessage | null> {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, category')
    .eq('recipient_id', userId)
    .eq('is_published', true)
    .eq('is_deleted', false);

  if (!messages || messages.length === 0) return null;
  const ids = messages.map((m) => m.id);

  const [{ data: reactions }, { data: comments }, { data: reposts }] = await Promise.all([
    supabase.from('message_reactions').select('message_id').in('message_id', ids),
    supabase.from('comments').select('message_id').eq('is_deleted', false).in('message_id', ids),
    supabase.from('reposts').select('original_message_id').in('original_message_id', ids),
  ]);

  const scores = new Map<string, number>();
  for (const r of reactions ?? []) scores.set(r.message_id, (scores.get(r.message_id) ?? 0) + 1);
  for (const c of comments ?? []) scores.set(c.message_id, (scores.get(c.message_id) ?? 0) + 2);
  for (const r of reposts ?? []) scores.set(r.original_message_id, (scores.get(r.original_message_id) ?? 0) + 3);

  let best: MostSuccessfulMessage | null = null;
  for (const message of messages) {
    const score = scores.get(message.id) ?? 0;
    if (!best || score > best.engagementScore) {
      best = { id: message.id, content: message.content, category: message.category, engagementScore: score };
    }
  }
  return best && best.engagementScore > 0 ? best : null;
}

/** Which day of the week this user's messages most often arrive on, all-time. */
export async function getMostActiveDay(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select('created_at')
    .eq('recipient_id', userId)
    .eq('is_deleted', false);

  if (!data || data.length === 0) return null;

  const dayLabels = ['الأحد', 'الإتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  const counts = new Map<number, number>();
  for (const row of data) {
    const day = new Date(row.created_at).getDay();
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const topDay = sorted[0]?.[0];
  return topDay !== undefined ? (dayLabels[topDay] ?? null) : null;
}
