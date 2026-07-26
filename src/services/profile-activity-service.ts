'use server';

import { createClient } from '@/lib/supabase/server';

export interface ProfileStats {
  totalMessages: number;
  totalCommentsPosted: number;
  totalReactionsReceived: number;
  totalRepostsReceived: number;
  joinDate: string;
}

export async function getProfileStats(profileId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  const [{ data: profile }, { count: commentsPosted }, { data: ownMessages }] = await Promise.all([
    supabase.from('profiles').select('message_count, created_at').eq('id', profileId).single(),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', profileId).eq('is_deleted', false),
    supabase.from('messages').select('id').eq('recipient_id', profileId).eq('is_deleted', false),
  ]);

  const messageIds = (ownMessages ?? []).map((m) => m.id);

  const [{ count: reactionsReceived }, { count: repostsReceived }] = await Promise.all([
    messageIds.length
      ? supabase.from('message_reactions').select('id', { count: 'exact', head: true }).in('message_id', messageIds)
      : Promise.resolve({ count: 0 }),
    messageIds.length
      ? supabase.from('reposts').select('id', { count: 'exact', head: true }).in('original_message_id', messageIds)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    totalMessages: profile?.message_count ?? 0,
    totalCommentsPosted: commentsPosted ?? 0,
    totalReactionsReceived: reactionsReceived ?? 0,
    totalRepostsReceived: repostsReceived ?? 0,
    joinDate: profile?.created_at ?? new Date().toISOString(),
  };
}

export interface RepliedMessageEntry {
  messageId: string;
  content: string;
  replyContent: string;
  createdAt: string;
}

/** The profile's own replies to messages they received — the "Replies" tab. */
export async function getProfileReplies(profileId: string, limit = 20): Promise<RepliedMessageEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('replies')
    .select('content, created_at, message:messages(id, content)')
    .eq('author_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  interface Row { content: string; created_at: string; message: { id: string; content: string } | { id: string; content: string }[] | null }

  return ((data as unknown as Row[]) ?? [])
    .map((row) => {
      const message = Array.isArray(row.message) ? row.message[0] : row.message;
      if (!message) return null;
      return { messageId: message.id, content: message.content, replyContent: row.content, createdAt: row.created_at };
    })
    .filter((r): r is RepliedMessageEntry => r !== null);
}

export interface PostedCommentEntry {
  messageId: string;
  messageContent: string;
  commentContent: string;
  createdAt: string;
}

/** Comments this profile has posted on others' messages — the "Comments" tab. */
export async function getProfileComments(profileId: string, limit = 20): Promise<PostedCommentEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('comments')
    .select('content, created_at, message:messages(id, content)')
    .eq('author_id', profileId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  interface Row { content: string; created_at: string; message: { id: string; content: string } | { id: string; content: string }[] | null }

  return ((data as unknown as Row[]) ?? [])
    .map((row) => {
      const message = Array.isArray(row.message) ? row.message[0] : row.message;
      if (!message) return null;
      return { messageId: message.id, messageContent: message.content, commentContent: row.content, createdAt: row.created_at };
    })
    .filter((c): c is PostedCommentEntry => c !== null);
}

export type ActivityKind = 'reply' | 'comment' | 'reaction' | 'repost';

export interface ActivityEntry {
  kind: ActivityKind;
  messageId: string;
  createdAt: string;
  detail?: string;
}

/** Chronological feed combining this profile's own reply/comment/reaction/repost actions — the "Activity" tab. */
export async function getProfileActivity(profileId: string, limit = 30): Promise<ActivityEntry[]> {
  const supabase = await createClient();

  const [{ data: replies }, { data: comments }, { data: reactions }, { data: reposts }] = await Promise.all([
    supabase.from('replies').select('message_id, created_at').eq('author_id', profileId),
    supabase.from('comments').select('message_id, content, created_at').eq('author_id', profileId).eq('is_deleted', false),
    supabase.from('message_reactions').select('message_id, emoji, created_at').eq('user_id', profileId),
    supabase.from('reposts').select('original_message_id, created_at').eq('reposted_by', profileId),
  ]);

  const entries: ActivityEntry[] = [
    ...(replies ?? []).map((r) => ({ kind: 'reply' as const, messageId: r.message_id, createdAt: r.created_at })),
    ...(comments ?? []).map((c) => ({ kind: 'comment' as const, messageId: c.message_id, createdAt: c.created_at, detail: c.content })),
    ...(reactions ?? []).map((r) => ({ kind: 'reaction' as const, messageId: r.message_id, createdAt: r.created_at, detail: r.emoji })),
    ...(reposts ?? []).map((r) => ({ kind: 'repost' as const, messageId: r.original_message_id, createdAt: r.created_at })),
  ];

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}
