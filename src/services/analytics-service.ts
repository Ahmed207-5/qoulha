import { createClient } from '@/lib/supabase/server';
import type { MessageCategory, MessageMood } from '@/types/domain';

export interface DistributionSlice {
  name: string;
  value: number;
  color?: string;
}

export async function getCategoryDistribution(userId: string): Promise<{ category: MessageCategory; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('messages').select('category').eq('recipient_id', userId).eq('is_deleted', false);

  const counts = new Map<MessageCategory, number>();
  for (const row of data ?? []) {
    const c = row.category as MessageCategory;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export async function getMoodDistribution(userId: string): Promise<{ mood: MessageMood; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('messages').select('mood').eq('recipient_id', userId).eq('is_deleted', false);

  const counts = new Map<MessageMood, number>();
  for (const row of data ?? []) {
    const m = row.mood as MessageMood;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()].map(([mood, count]) => ({ mood, count }));
}

export async function getGrowthTrend(userId: string): Promise<{ date: string; messages: number; visits: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [{ data: messages }, { data: visits }] = await Promise.all([
    supabase.from('messages').select('created_at').eq('recipient_id', userId).eq('is_deleted', false).gte('created_at', since.toISOString()),
    supabase.from('visits').select('created_at').eq('profile_id', userId).gte('created_at', since.toISOString()),
  ]);

  const buckets = new Map<string, { messages: number; visits: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { messages: 0, visits: 0 });
  }
  for (const row of messages ?? []) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.get(key)!.messages++;
  }
  for (const row of visits ?? []) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.get(key)!.visits++;
  }

  return [...buckets.entries()].map(([date, v]) => ({ date: date.slice(5), ...v }));
}
