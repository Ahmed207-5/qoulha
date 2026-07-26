'use server';

import { createClient } from '@/lib/supabase/server';
import type { SuggestedUser } from '@/types/domain';

/**
 * "People You May Know" — one RPC call does all the filtering/ranking/
 * randomization (see get_suggested_users() in 0024_suggested_users.sql).
 * Returns [] for a logged-out viewer (the function requires auth.uid()
 * and is only granted to `authenticated`) — callers should simply not
 * render the section in that case, same as the Follow button already
 * requires login.
 */
export async function getSuggestedUsers(excludeIds: string[] = [], limit = 10): Promise<SuggestedUser[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_suggested_users', {
    p_limit: limit,
    p_exclude_ids: excludeIds,
  });
  if (error) return [];
  return data ?? [];
}
