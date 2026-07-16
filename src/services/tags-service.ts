'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tag } from '@/types/domain';

export async function getTrendingTags(limit = 12): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tags')
    .select('id, name, slug, usage_count')
    .order('usage_count', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function searchTags(query: string, limit = 10): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tags')
    .select('id, name, slug, usage_count')
    .ilike('name', `%${query.toLowerCase()}%`)
    .order('usage_count', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('tags').select('id, name, slug, usage_count').eq('slug', slug).maybeSingle();
  return data;
}
