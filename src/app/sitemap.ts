import { createClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qoulha.vercel.app';
  const supabase = await createClient();

  const [{ data: profiles }, { data: messages }] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('is_public', true)
      .eq('is_suspended', false)
      .limit(5000),
    supabase
      .from('messages')
      .select('id, published_at')
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('published_at', { ascending: false })
      .limit(5000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/wall`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/register`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${base}/u/${p.username}`,
    lastModified: p.updated_at,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const messageRoutes: MetadataRoute.Sitemap = (messages ?? []).map((m) => ({
    url: `${base}/m/${m.id}`,
    lastModified: m.published_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...profileRoutes, ...messageRoutes];
}
