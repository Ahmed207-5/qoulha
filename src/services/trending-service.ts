'use server';

import { createClient } from '@/lib/supabase/server';
import type { PublicWallMessage, ReactionEmoji, Reply } from '@/types/domain';
import { REACTION_EMOJIS } from '@/constants/message';

export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';

function periodStart(period: TrendingPeriod): string {
  const date = new Date();
  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

interface TrendingRow {
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

/** Engagement score = reactions + comments×2 + reposts×3 (comments/reposts signal stronger engagement than a tap). */
export async function getTrendingMessages(period: TrendingPeriod, limit = 20): Promise<PublicWallMessage[]> {
  const supabase = await createClient();
  const since = periodStart(period);

  const { data, error } = await supabase
    .from('messages')
    .select(
      `id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at,
       recipient:profiles!messages_recipient_id_fkey(username, full_name, avatar_url),
       message_reactions(emoji),
       replies(id, message_id, author_id, content, created_at, updated_at)`
    )
    .eq('is_published', true)
    .eq('is_deleted', false)
    .gte('published_at', since)
    .limit(200); // candidate pool, ranked below then trimmed to `limit`

  if (error || !data) return [];

  const rows = data as unknown as TrendingRow[];
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
    score: number;
  }

  const messages: ScoredMessage[] = rows
    .map((row): ScoredMessage | null => {
      const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>;
      for (const r of row.message_reactions ?? []) {
        if (counts[r.emoji as ReactionEmoji] !== undefined) counts[r.emoji as ReactionEmoji]++;
      }
      const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
      if (!recipient) return null;
      const reply = Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies;
      const reactionsTotal = Object.values(counts).reduce((a, b) => a + b, 0);
      const commentsCount = commentsCountMap.get(row.id) ?? 0;
      const repostCount = repostCountMap.get(row.id) ?? 0;

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
        comments_count: commentsCount,
        repost_count: repostCount,
        my_reaction: null,
        reposted_by_me: false,
        tags: [],
        score: reactionsTotal + commentsCount * 2 + repostCount * 3,
      };
    })
    .filter((m): m is ScoredMessage => m !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return messages;
}
