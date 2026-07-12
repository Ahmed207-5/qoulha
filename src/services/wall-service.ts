'use server';

import { createClient } from '@/lib/supabase/server';
import type { PublicWallMessage, ReactionEmoji, Reply } from '@/types/domain';
import { REACTION_EMOJIS } from '@/constants/message';

export interface WallQuery {
  cursor?: string; // ISO timestamp of the last item's published_at, for keyset pagination
  search?: string;
  pageSize?: number;
  /** Milestone 1: current viewer, used to resolve my_reaction / reposted_by_me. */
  viewerId?: string;
}

export interface WallQueryResult {
  messages: PublicWallMessage[];
  nextCursor: string | null;
}

export async function getWallMessagesAction(query: WallQuery): Promise<WallQueryResult> {
  const supabase = await createClient();
  const pageSize = query.pageSize ?? 12;

  let q = supabase
    .from('messages')
    .select(
      `id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at,
       recipient:profiles!messages_recipient_id_fkey(username, full_name, avatar_url),
       message_reactions(emoji),
       replies(id, message_id, author_id, content, created_at, updated_at)`
    )
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('published_at', { ascending: false })
    .limit(pageSize);

  if (query.cursor) q = q.lt('published_at', query.cursor);
  if (query.search) q = q.ilike('content', `%${query.search}%`);

  const { data, error } = await q;
  if (error || !data) return { messages: [], nextCursor: null };

  interface WallRow {
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

  const rows = data as unknown as WallRow[];
  const ids = rows.map((r) => r.id);

  // Batched follow-up queries (using .in()) instead of one round trip per
  // card — keeps this at a fixed small number of queries per page load
  // regardless of pageSize.
  const [{ data: commentRows }, { data: repostRows }, { data: myReactionRows }, { data: myRepostRows }] = await Promise.all([
    ids.length
      ? supabase.from('comments').select('message_id').eq('is_deleted', false).in('message_id', ids)
      : Promise.resolve({ data: [] as { message_id: string }[] }),
    ids.length
      ? supabase.from('reposts').select('original_message_id').in('original_message_id', ids)
      : Promise.resolve({ data: [] as { original_message_id: string }[] }),
    ids.length && query.viewerId
      ? supabase.from('message_reactions').select('message_id, emoji').eq('user_id', query.viewerId).in('message_id', ids)
      : Promise.resolve({ data: [] as { message_id: string; emoji: string }[] }),
    ids.length && query.viewerId
      ? supabase.from('reposts').select('original_message_id').eq('reposted_by', query.viewerId).in('original_message_id', ids)
      : Promise.resolve({ data: [] as { original_message_id: string }[] }),
  ]);

  const commentsCountMap = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentsCountMap.set(row.message_id, (commentsCountMap.get(row.message_id) ?? 0) + 1);
  }

  const repostCountMap = new Map<string, number>();
  for (const row of repostRows ?? []) {
    repostCountMap.set(row.original_message_id, (repostCountMap.get(row.original_message_id) ?? 0) + 1);
  }

  const myReactionMap = new Map<string, ReactionEmoji>();
  for (const row of myReactionRows ?? []) myReactionMap.set(row.message_id, row.emoji as ReactionEmoji);

  const myRepostSet = new Set((myRepostRows ?? []).map((r) => r.original_message_id));

  const messages: PublicWallMessage[] = rows
    .map((row): PublicWallMessage | null => {
      const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>;
      for (const r of row.message_reactions ?? []) {
        if (counts[r.emoji as ReactionEmoji] !== undefined) counts[r.emoji as ReactionEmoji]++;
      }
      const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
      if (!recipient) return null;
      const reply = Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies;

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
        my_reaction: myReactionMap.get(row.id) ?? null,
        reposted_by_me: myRepostSet.has(row.id),
      };
    })
    .filter((m): m is PublicWallMessage => m !== null);

  const lastMessage = messages[messages.length - 1];
  const nextCursor = messages.length === pageSize && lastMessage ? lastMessage.published_at : null;
  return { messages, nextCursor };
}
