import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/domain';
import { cache } from 'react';

export interface PublicProfileView extends Profile {
  allow_messages: boolean;
}

/**
 * cache() dedupes this across the layout/page tree in a single request,
 * so the profile page + metadata generation don't double-fetch.
 */
export const getPublicProfileByUsername = cache(async (username: string): Promise<PublicProfileView | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_settings(allow_messages)')
    .eq('username', username.toLowerCase())
    .eq('is_public', true)
    .eq('is_suspended', false)
    .maybeSingle();

  if (error || !data) return null;

  const { user_settings, ...profile } = data as Profile & {
    user_settings: { allow_messages: boolean } | { allow_messages: boolean }[] | null;
  };
  const settings = Array.isArray(user_settings) ? user_settings[0] : user_settings;
  return { ...profile, allow_messages: settings?.allow_messages ?? true };
});

export async function logProfileVisit(profileId: string, fingerprint: string, referrer: string | null) {
  const supabase = await createClient();
  await supabase.from('visits').insert({
    profile_id: profileId,
    visitor_fingerprint: fingerprint,
    referrer,
  });
  // Atomic increment via Postgres function — avoids read-then-write race
  // conditions under concurrent visits (see 0004_functions.sql).
  await supabase.rpc('increment_visitor_count', { p_profile_id: profileId });
}
