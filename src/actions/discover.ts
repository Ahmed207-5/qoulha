'use server';

import { createClient } from '@/lib/supabase/server';
import type { MessageCategory } from '@/types/domain';

/** Returns a random published message id, optionally filtered by category. */
export async function getRandomMessageAction(category?: MessageCategory): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_random_message', { p_category: category ?? null });
  if (error) return null;
  return data ?? null;
}

/** Returns today's featured message id, creating it if this is the first request of the day. */
export async function getDailyFeatureAction(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_or_create_daily_feature');
  if (error) return null;
  return data ?? null;
}
