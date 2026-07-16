'use server';

import { createClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/constants/levels';
import type { EarnedBadge, LevelInfo } from '@/types/domain';

export async function getUserLevelInfo(userId: string): Promise<LevelInfo> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  return getLevelInfo(data?.xp ?? 0);
}

interface UserBadgeRow {
  earned_at: string;
  badge: { id: string; code: string; name: string; description: string; icon: string } | { id: string; code: string; name: string; description: string; icon: string }[];
}

export async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_badges')
    .select('earned_at, badge:badges(id, code, name, description, icon)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as UserBadgeRow[]).map((row) => {
    const badge = Array.isArray(row.badge) ? row.badge[0] : row.badge;
    return {
      id: badge?.id ?? '',
      code: badge?.code ?? '',
      name: badge?.name ?? '',
      description: badge?.description ?? '',
      icon: badge?.icon ?? 'Award',
      earned_at: row.earned_at,
    };
  }).filter((b) => b.id !== '');
}

/** All 8 catalog badges, with earned state — used for the profile's "locked vs earned" badge grid. */
export async function getAllBadgesWithEarnedState(userId: string): Promise<(EarnedBadge & { earned: boolean })[]> {
  const supabase = await createClient();
  const [{ data: allBadges }, earnedBadges] = await Promise.all([
    supabase.from('badges').select('id, code, name, description, icon').order('created_at'),
    getUserBadges(userId),
  ]);

  const earnedMap = new Map(earnedBadges.map((b) => [b.id, b.earned_at]));

  return (allBadges ?? []).map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earned_at: earnedMap.get(badge.id) ?? '',
  }));
}
