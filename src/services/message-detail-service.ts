'use server';

import { createClient } from '@/lib/supabase/server';
import type { PublicWallMessage, Reply, ReactionEmoji, Profile, Tag } from '@/types/domain';
import { REACTION_EMOJIS } from '@/constants/message';

interface MessageDetailRow {
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

/** Fetches one published message with its full social payload for the detail page. */
export async function getMessageDetail(messageId: string, viewerId?: string): Promise<PublicWallMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('messages')
    .select(
      `id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at,
       recipient:profiles!messages_recipient_id_fkey(username, full_name, avatar_url),
       message_reactions(emoji),
       replies(id, message_id, author_id, content, created_at, updated_at)`
    )
    .eq('id', messageId)
    .eq('is_published', true)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as MessageDetailRow;

  const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
  if (!recipient) return null;

  const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>;
  for (const r of row.message_reactions ?? []) {
    if (counts[r.emoji as ReactionEmoji] !== undefined) counts[r.emoji as ReactionEmoji]++;
  }
  const reply = Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies;

  const [{ count: commentsCount }, { count: repostCount }, myReactionResult, myRepostResult, { data: tagRows }] = await Promise.all([
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('message_id', messageId).eq('is_deleted', false),
    supabase.from('reposts').select('id', { count: 'exact', head: true }).eq('original_message_id', messageId),
    viewerId
      ? supabase.from('message_reactions').select('emoji').eq('message_id', messageId).eq('user_id', viewerId).maybeSingle()
      : Promise.resolve({ data: null as { emoji: string } | null }),
    viewerId
      ? supabase.from('reposts').select('id').eq('original_message_id', messageId).eq('reposted_by', viewerId).maybeSingle()
      : Promise.resolve({ data: null as { id: string } | null }),
    supabase.from('message_tags').select('tag:tags(id, name, slug, usage_count)').eq('message_id', messageId),
  ]);

  const tags: Tag[] = (tagRows ?? [])
    .map((row) => (Array.isArray(row.tag) ? row.tag[0] : row.tag))
    .filter((t): t is Tag => !!t);

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
    comments_count: commentsCount ?? 0,
    repost_count: repostCount ?? 0,
    my_reaction: (myReactionResult.data?.emoji as ReactionEmoji) ?? null,
    reposted_by_me: !!myRepostResult.data,
    tags,
  };
}

export interface RepostEntry {
  id: string;
  reposter: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
  created_at: string;
}

interface RepostRow {
  id: string;
  created_at: string;
  reposter: RepostEntry['reposter'] | RepostEntry['reposter'][];
}

/** Used by the message detail page's "reposted by" moderation list. */
export async function getRepostsForMessage(messageId: string): Promise<RepostEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reposts')
    .select('id, created_at, reposter:profiles!reposts_reposted_by_fkey(username, full_name, avatar_url)')
    .eq('original_message_id', messageId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as RepostRow[]).map((row) => {
    const reposter = Array.isArray(row.reposter) ? row.reposter[0] : row.reposter;
    return {
      id: row.id,
      created_at: row.created_at,
      reposter: reposter ?? { username: '', full_name: 'مستخدم محذوف', avatar_url: null },
    };
  });
}
