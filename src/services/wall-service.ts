'use server';

import { createClient } from '@/lib/supabase/server';
import type { PublicWallMessage, ReactionEmoji } from '@/types/domain';
import { REACTION_EMOJIS } from '@/constants/message';

export interface WallQuery {
  cursor?: string; // ISO timestamp of the last item's published_at, for keyset pagination
  search?: string;
  pageSize?: number;
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
       reactions(emoji)`
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
    reactions: { emoji: string }[] | null;
  }

  const messages: PublicWallMessage[] = (data as unknown as WallRow[])
    .map((row): PublicWallMessage | null => {
      const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>;
      for (const r of row.reactions ?? []) {
        if (counts[r.emoji as ReactionEmoji] !== undefined) counts[r.emoji as ReactionEmoji]++;
      }
      const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
      if (!recipient) return null;
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
        recipient,
        reaction_counts: counts,
      };
    })
    .filter((m): m is PublicWallMessage => m !== null);

  const lastMessage = messages[messages.length - 1];
  const nextCursor = messages.length === pageSize && lastMessage ? lastMessage.published_at : null;
  return { messages, nextCursor };
}
