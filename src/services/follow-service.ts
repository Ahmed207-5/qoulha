'use server';

import { createClient } from '@/lib/supabase/server';

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

/** Used by profile pages and the FollowButton to render current state in one query batch. */
export async function getFollowStats(profileId: string, viewerId?: string): Promise<FollowStats> {
  const supabase = await createClient();

  const [{ count: followerCount }, { count: followingCount }, followRow] = await Promise.all([
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileId),
    viewerId
      ? supabase.from('follows').select('id').eq('follower_id', viewerId).eq('following_id', profileId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    isFollowing: !!followRow.data,
  };
}
