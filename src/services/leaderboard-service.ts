'use server';

import { createClient } from '@/lib/supabase/server';

export type LeaderboardMetric = 'xp' | 'reactions' | 'comments' | 'followers' | 'reposts' | 'visits';
export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  score: number;
}

function periodStart(period: LeaderboardPeriod): string | null {
  if (period === 'all_time') return null;
  const date = new Date();
  date.setDate(date.getDate() - (period === 'weekly' ? 7 : 30));
  return date.toISOString();
}

interface ProfileRef {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

async function attachProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scores: Map<string, number>,
  limit: number
): Promise<LeaderboardEntry[]> {
  const topIds = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (topIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', topIds.map(([id]) => id));

  const profileMap = new Map((profiles as ProfileRef[] | null ?? []).map((p) => [p.id, p]));

  return topIds
    .map(([userId, score]) => {
      const profile = profileMap.get(userId);
      if (!profile) return null;
      return { userId, username: profile.username, fullName: profile.full_name, avatarUrl: profile.avatar_url, score };
    })
    .filter((e): e is LeaderboardEntry => e !== null);
}

export async function getLeaderboard(metric: LeaderboardMetric, period: LeaderboardPeriod, limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const since = periodStart(period);

  if (metric === 'xp') {
    if (period === 'all_time') {
      const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, xp').order('xp', { ascending: false }).limit(limit);
      return (data ?? []).map((p) => ({ userId: p.id, username: p.username, fullName: p.full_name, avatarUrl: p.avatar_url, score: p.xp }));
    }
    let q = supabase.from('xp_events').select('user_id, amount');
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const scores = new Map<string, number>();
    for (const row of data ?? []) scores.set(row.user_id, (scores.get(row.user_id) ?? 0) + row.amount);
    return attachProfiles(supabase, scores, limit);
  }

  if (metric === 'followers') {
    let q = supabase.from('follows').select('following_id, created_at');
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const scores = new Map<string, number>();
    for (const row of data ?? []) scores.set(row.following_id, (scores.get(row.following_id) ?? 0) + 1);
    return attachProfiles(supabase, scores, limit);
  }

  if (metric === 'visits') {
    if (period === 'all_time') {
      const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, visitor_count').order('visitor_count', { ascending: false }).limit(limit);
      return (data ?? []).map((p) => ({ userId: p.id, username: p.username, fullName: p.full_name, avatarUrl: p.avatar_url, score: p.visitor_count }));
    }
    let q = supabase.from('visits').select('profile_id, created_at');
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const scores = new Map<string, number>();
    for (const row of data ?? []) scores.set(row.profile_id, (scores.get(row.profile_id) ?? 0) + 1);
    return attachProfiles(supabase, scores, limit);
  }

  // reactions / comments / reposts — all require joining through `messages`
  // to find the RECIPIENT (the message owner receiving the engagement).
  if (metric === 'reactions') {
    let q = supabase.from('message_reactions').select('created_at, message:messages(recipient_id)');
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const scores = new Map<string, number>();
    for (const row of (data as unknown as { message: { recipient_id: string } | { recipient_id: string }[] | null }[] | null) ?? []) {
      const message = Array.isArray(row.message) ? row.message[0] : row.message;
      if (message) scores.set(message.recipient_id, (scores.get(message.recipient_id) ?? 0) + 1);
    }
    return attachProfiles(supabase, scores, limit);
  }

  if (metric === 'comments') {
    let q = supabase.from('comments').select('created_at, is_deleted, message:messages(recipient_id)').eq('is_deleted', false);
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const scores = new Map<string, number>();
    for (const row of (data as unknown as { message: { recipient_id: string } | { recipient_id: string }[] | null }[] | null) ?? []) {
      const message = Array.isArray(row.message) ? row.message[0] : row.message;
      if (message) scores.set(message.recipient_id, (scores.get(message.recipient_id) ?? 0) + 1);
    }
    return attachProfiles(supabase, scores, limit);
  }

  // reposts
  let q = supabase.from('reposts').select('created_at, message:messages!reposts_original_message_id_fkey(recipient_id)');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;
  const scores = new Map<string, number>();
  for (const row of (data as unknown as { message: { recipient_id: string } | { recipient_id: string }[] | null }[] | null) ?? []) {
    const message = Array.isArray(row.message) ? row.message[0] : row.message;
    if (message) scores.set(message.recipient_id, (scores.get(message.recipient_id) ?? 0) + 1);
  }
  return attachProfiles(supabase, scores, limit);
}
