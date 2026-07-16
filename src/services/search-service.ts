'use server';

import { createClient } from '@/lib/supabase/server';
import type { MessageCategory, MessageMood, PublicWallMessage, ReactionEmoji, Reply } from '@/types/domain';
import { REACTION_EMOJIS } from '@/constants/message';

export type SearchSort = 'newest' | 'oldest' | 'most_reacted' | 'most_commented' | 'most_reposted';

export interface SearchFilters {
  query?: string;
  category?: MessageCategory;
  mood?: MessageMood;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

interface SearchRow {
  id: string;
  recipient_id: string;
  content: string;
  category: PublicWallMessage['category'];
  mood: PublicWallMessage['mood'];
  is_read: boolean;
  is_favorited: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  recipient: PublicWallMessage['recipient'] | PublicWallMessage['recipient'][];
  message_reactions: { emoji: string }[] | null;
  replies: Reply | Reply[] | null;
}

/**
 * Search results reuse the exact same PublicWallMessage shape as the wall
 * feed (same card component, same social data). Engagement-based sorts
 * (most_reacted/commented/reposted) happen client-side after one fetch
 * batch — PostgREST can't order by a related table's count directly
 * without a materialized view, and this app's scale doesn't justify one.
 */
export async function searchMessages(
  filters: SearchFilters
): Promise<{ messages: PublicWallMessage[]; totalCount: number }> {
  const supabase = await createClient();
  const pageSize = filters.pageSize ?? 20;
  const page = filters.page ?? 0;

  let q = supabase
    .from('messages')
    .select(
      `id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at,
       recipient:profiles!messages_recipient_id_fkey(username, full_name, avatar_url),
       message_reactions(emoji),
       replies(id, message_id, author_id, content, created_at, updated_at)`,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .eq('is_deleted', false);

  if (filters.query) q = q.ilike('content', `%${filters.query}%`);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.mood) q = q.eq('mood', filters.mood);

  q = filters.sort === 'oldest' ? q.order('published_at', { ascending: true }) : q.order('published_at', { ascending: false });

  const from = page * pageSize;
  const { data, count, error } = await q.range(from, from + pageSize - 1);
  if (error || !data) return { messages: [], totalCount: 0 };

  const rows = data as unknown as SearchRow[];
  const ids = rows.map((r) => r.id);

  const [{ data: commentRows }, { data: repostRows }] = await Promise.all([
    ids.length
      ? supabase.from('comments').select('message_id').eq('is_deleted', false).in('message_id', ids)
      : Promise.resolve({ data: [] as { message_id: string }[] }),
    ids.length
      ? supabase.from('reposts').select('original_message_id').in('original_message_id', ids)
      : Promise.resolve({ data: [] as { original_message_id: string }[] }),
  ]);

  const commentsCountMap = new Map<string, number>();
  for (const row of commentRows ?? []) commentsCountMap.set(row.message_id, (commentsCountMap.get(row.message_id) ?? 0) + 1);
  const repostCountMap = new Map<string, number>();
  for (const row of repostRows ?? []) repostCountMap.set(row.original_message_id, (repostCountMap.get(row.original_message_id) ?? 0) + 1);

  interface ScoredMessage extends PublicWallMessage {
    totalReactions: number;
  }

  let messages: ScoredMessage[] = rows
    .map((row): ScoredMessage | null => {
      const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>;
      for (const r of row.message_reactions ?? []) {
        if (counts[r.emoji as ReactionEmoji] !== undefined) counts[r.emoji as ReactionEmoji]++;
      }
      const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
      if (!recipient) return null;
      const reply = Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies;
      const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

      return {
        id: row.id,
        recipient_id: row.recipient_id,
        content: row.content,
        category: row.category,
        mood: row.mood,
        is_read: row.is_read,
        is_favorited: row.is_favorited,
        is_published: row.is_published,
        published_at: row.published_at,
        created_at: row.created_at,
        reply,
        recipient,
        reaction_counts: counts,
        comments_count: commentsCountMap.get(row.id) ?? 0,
        repost_count: repostCountMap.get(row.id) ?? 0,
        my_reaction: null,
        reposted_by_me: false,
        tags: [],
        totalReactions,
      };
    })
    .filter((m): m is ScoredMessage => m !== null);

  if (filters.sort === 'most_reacted') {
    messages = [...messages].sort((a, b) => b.totalReactions - a.totalReactions);
  } else if (filters.sort === 'most_commented') {
    messages = [...messages].sort((a, b) => b.comments_count - a.comments_count);
  } else if (filters.sort === 'most_reposted') {
    messages = [...messages].sort((a, b) => b.repost_count - a.repost_count);
  }

  return { messages, totalCount: count ?? 0 };
}

export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  message_count: number;
}

export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, message_count')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .eq('is_public', true)
    .eq('is_suspended', false)
    .order('message_count', { ascending: false })
    .limit(limit);
  return data ?? [];
}
